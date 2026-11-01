/** Own live state, command serialization and one monotonic clock for frames and input. */
import type { AppError, AppState, Capabilities, FileFormat, GameAction, GameView, InputFile, Outcome, SettingKey, SettingPatch, Transition, PortableSnapshot } from '../models';
import type { PlatformPorts } from '../platform/ports';
import { advanceGame, createGame, dispatchGame, projectGame, setPaused } from '../domain';
import { encodeSnapshot, decodeSnapshot } from '../files';
import { rankResults, resolveSettings, validateSettings } from '../rules';
export interface Controller {
  view(): GameView; start(): void; pause(): void; resume(): void; action(action: GameAction): void; tick(): void;
  setSettings(patch: SettingPatch): Promise<Outcome<void>>;
  save(format: FileFormat): Promise<Outcome<void>>;
  restore(file: InputFile): Promise<Outcome<void>>;
  subscribe(listener: (view: GameView) => void): () => void;
  suspend(): Promise<Outcome<void>>; dispose(): void;
}

/** Compose a page session; all host-dependent values enter through narrow ports. */
export function createController(initial: AppState, ports: PlatformPorts, capabilities: Capabilities): Controller {
  let state = structuredClone(initial), error: AppError | null = null, stickyError:AppError|null=null;
  let lastTime = ports.now(), disposed = false, busy = false;
  const caps = new Set(capabilities);
  let initializing=caps.has('persistentSettings');
  let fileGeneration=0,fileAbort:AbortController|null=null;
  const listeners = new Set<(view: GameView) => void>();
  type Job={run:()=>void|Outcome<void>|Promise<Outcome<void>>;cancel:()=>void;complete?:(result:Outcome<void>)=>void};
  const pending:Job[]=[];let active:Job|null=null;
  const view = (): GameView => ({ state: structuredClone(state), ...structuredClone(projectGame(state.game, state.settings, caps)), capabilities: new Set(caps), error: structuredClone(error) });
  const emit = () => { for (const listener of [...listeners]) if (!disposed) listener(view()); };
  const asynchronous=(value:void|Outcome<void>|Promise<Outcome<void>>):value is Promise<Outcome<void>>=>typeof (value as Promise<Outcome<void>>|undefined)?.then==='function';
  const drain = () => {
    if (busy||initializing||disposed) return;
    busy=true;let waiting=false;
    try{
      while(pending.length&&!disposed){
        const job=pending.shift()!;active=job;const result=job.run();
        if(asynchronous(result)){
          waiting=true;
          const finish=(value:Outcome<void>)=>{active=null;busy=false;job.complete?.(disposed?unavailable('Operation'):value);drain();};
          void result.then(finish,()=>{
            const failure:Outcome<void>={ok:false,error:{code:'runtime-unavailable',message:'The requested operation could not be completed.'}};
            try{if(!disposed){error=failure.error;emit();}}finally{finish(failure);}
          });
          return;
        }
        active=null;job.complete?.(result??{ok:true,value:undefined});
      }
    }finally{if(!waiting){active=null;busy=false;}}
  };
  const enqueue=(job:Job)=>{if(disposed){job.cancel();return;}pending.push(job);drain();};
  const perform=(operation:()=>void,cancel:()=>void=()=>{})=>enqueue({run:operation,cancel});
  const operate=(operation:()=>Outcome<void>|Promise<Outcome<void>>,cancel?:()=>Outcome<void>):Promise<Outcome<void>>=>new Promise(resolve=>enqueue({run:operation,complete:resolve,cancel:()=>resolve(cancel?.()??unavailable('Operation'))}));
  const accept = (result: Transition) => {
    state = { ...state, game: result.state };
    if (result.events.some(event => event.type === 'gameOver') && state.completedRunId !== result.state.runId) {
      // A run is remembered even when its score misses the top ten. Restored identities are never rewritten.
      const recorded=state.results.some(row=>row.id===result.state.runId);
      const results=caps.has('leaderboard')&&!recorded?rankResults([...state.results,{id:result.state.runId,score:result.state.score,timestamp:ports.utcNow()}]):state.results;
      state = { ...state, results, completedRunId: result.state.runId };
    }
  };
  const sync = () => {
    const now = ports.now();
    const elapsed = Math.max(0, now - lastTime);
    lastTime = Math.max(lastTime, now);
    if (state.game.status === 'running' && elapsed > 0) accept(advanceGame(state.game, elapsed, state.settings, caps));
  };
  const unavailable = (feature: string): Outcome<void> => ({ ok: false, error: { code: 'runtime-unavailable', message: disposed ? 'This game session is closed.' : `${feature} is not available in this build.` } });
  const closedFile=():Outcome<void>=>({ok:false,error:{code:'stale-session',message:'This file operation belongs to a closed game session.'}});
  const fileJob=(operation:(signal:AbortSignal,alive:()=>boolean)=>Promise<Outcome<void>>)=>operate(async()=>{
    if(!caps.has('files'))return unavailable('Files');
    const owner=new AbortController(),generation=++fileGeneration;fileAbort=owner;
    const alive=()=>!disposed&&!owner.signal.aborted&&fileGeneration===generation;
    try{
      sync();state={...state,game:setPaused(state.game,true)};emit();if(!alive())return closedFile();
      let result:Outcome<void>;
      try{result=await operation(owner.signal,alive);}catch{result={ok:false,error:{code:'file-failed',message:'The file operation could not be completed; no partial snapshot was loaded.'}};}
      if(!alive())return closedFile();
      if(!result.ok){error=result.error;if(error.code==='persistence-failed')stickyError=error;}else error=stickyError;
      emit();return result;
    }finally{if(fileAbort===owner)fileAbort=null;}
  },closedFile);
  let release = () => {};
  const controller: Controller = {
    view,
    start: () => perform(() => {
      sync();
      state = { ...state, game: createGame(ports.newSeed(), ports.newId(), state.settings, caps, 'running'), completedRunId: null };
      lastTime = ports.now(); error = stickyError; emit();
    }),
    pause: () => perform(() => { sync(); state = { ...state, game: setPaused(state.game, true) }; emit(); }),
    resume: () => perform(() => { sync(); state = { ...state, game: setPaused(state.game, false) }; lastTime = ports.now(); emit(); }),
    action: action => perform(() => { sync(); accept(dispatchGame(state.game, action, state.settings, caps)); emit(); }),
    tick: () => perform(() => { sync(); emit(); }),
    setSettings: patch => operate(()=>{
      if(!caps.has('settings'))return unavailable('Settings');
      const invalid:Outcome<void>={ok:false,error:{code:'invalid-data',message:'Choose correctly typed settings; the edit was not applied.'}};
      if(typeof patch!=='object'||patch===null||Array.isArray(patch)){error=invalid.error;emit();return invalid;}
      const descriptors=Object.getOwnPropertyDescriptors(patch);
      if(Reflect.ownKeys(patch).some(key=>typeof key!=='string'||!Object.hasOwn(descriptors[key]!,'value'))){error=invalid.error;emit();return invalid;}
      const result=validateSettings({...state.settings,...Object.fromEntries(Object.entries(descriptors).map(([key,descriptor])=>[key,descriptor.value]))});
      if(!result.ok){error=result.error;emit();return result;}
      const keys=Object.keys(descriptors) as SettingKey[];if(!keys.length)return {ok:true,value:undefined};
      const apply=():Outcome<void>=>{sync();state={...state,settings:result.value};stickyError=null;error=null;emit();return {ok:true,value:undefined};};
      if(!caps.has('persistentSettings'))return apply();
      return (async()=>{
        if(disposed)return unavailable('Settings');let saved:Outcome<void>;
        try{saved=await ports.commitSettings({previous:structuredClone(state.settings),next:structuredClone(result.value),writeKeys:keys,reason:'edit'});}
        catch{saved={ok:false,error:{code:'persistence-failed',message:'The setting edit could not be saved.'}};}
        if(disposed)return unavailable('Settings');
        if(!saved.ok){stickyError=saved.error;error=saved.error;emit();return saved;}
        return apply();
      })();
    }),
    save: format=>fileJob(async(signal,alive)=>{
      const snapshot:PortableSnapshot={formatVersion:1,results:structuredClone(state.results),settings:structuredClone(state.settings)};
      const encoded=await encodeSnapshot(snapshot,format,signal);if(!alive())return closedFile();if(!encoded.ok)return encoded;
      return ports.download({name:format==='sqlite'?'tetris-save.sqlite':'tetris-save.json',bytes:encoded.value});
    }),
    restore: file=>fileJob(async(signal,alive)=>{
      const decoded=await decodeSnapshot(file.bytes,signal);if(!alive())return closedFile();if(!decoded.ok)return decoded;
      const candidate=decoded.value;
      if(caps.has('persistentSettings')){
        let saved:Outcome<void>;
        try{saved=await ports.commitSettings({previous:structuredClone(state.settings),next:structuredClone(candidate.settings),writeKeys:Object.keys(state.settings) as SettingKey[],reason:'restore'});}
        catch{saved={ok:false,error:{code:'persistence-failed',message:'Restored settings could not be saved.'}};}
        if(!alive())return closedFile();if(!saved.ok)return saved;
      }
      sync();state={...state,results:structuredClone(candidate.results),settings:structuredClone(candidate.settings)};stickyError=null;
      return {ok:true,value:undefined};
    }),
    subscribe: listener => {
      if (disposed) return () => {};
      listeners.add(listener); listener(view());
      return () => { listeners.delete(listener); };
    },
    suspend: () => new Promise(resolve=>perform(()=>{
      sync();state={...state,game:setPaused(state.game,true)};emit();
      if(disposed){resolve(unavailable('Suspending'));return;}
      const snapshot=structuredClone(state);
      void (async()=>{
        let result:Outcome<void>;
        try{result=await ports.writeCheckpoint(snapshot);}catch{result={ok:false,error:{code:'checkpoint-failed',message:'The paused session could not be saved.'}};}
        if(!result.ok&&!disposed){const failure=result;perform(()=>{error=failure.error;emit();});}
        resolve(result);
      })();
    },()=>resolve(unavailable('Suspending')))),
    dispose: () => { if (!disposed) { disposed = true;fileGeneration++;fileAbort?.abort(); release(); listeners.clear(); active?.cancel(); while(pending.length)pending.shift()!.cancel(); } }
  };
  release = ports.bindLifecycle(() => { void controller.suspend(); });
  if(initializing)void (async()=>{
    try{
      const raw=await ports.readSettings();if(disposed)return;if(!raw.ok){error=raw.error;return;}
      const resolution=resolveSettings(raw.value.query,raw.value.saved);
      let saved:Outcome<void>;
      try{saved=await ports.commitSettings({previous:structuredClone(state.settings),next:structuredClone(resolution.settings),writeKeys:[...resolution.explicit],reason:'startup'});}
      catch{saved={ok:false,error:{code:'persistence-failed',message:'These page settings could not be saved.'}};}
      if(disposed)return;sync();
      const game=state.game.active?state.game:{...state.game,piecePolicy:{lockPolicy:resolution.settings.lockPolicy,hardDropLock:resolution.settings.hardDropLock}};
      state={...state,game,settings:resolution.settings};
      const warnings=resolution.warnings.join(' ');
      error=!saved.ok?{...saved.error,message:[saved.error.message,warnings].filter(Boolean).join(' ')}:warnings?{code:'invalid-data',message:warnings}:null;
    }catch{if(!disposed)error={code:'persistence-failed',message:'Browser configuration is unavailable; default settings remain usable.'};}
    finally{initializing=false;if(!disposed){stickyError=error;busy=true;try{emit();}finally{busy=false;drain();}}}
  })();
  return controller;
}
