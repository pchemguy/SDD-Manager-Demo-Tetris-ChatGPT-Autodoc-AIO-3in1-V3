/** Own live state, command serialization and one monotonic clock for frames and input. */
import type { AppError, AppState, Capabilities, FileFormat, GameAction, GameView, InputFile, Outcome, SettingPatch, Transition } from '../models';
import type { PlatformPorts } from '../platform/ports';
import { advanceGame, createGame, dispatchGame, projectGame, setPaused } from '../domain';
import { validateSettings } from '../rules';
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
  let state = structuredClone(initial), error: AppError | null = null;
  let lastTime = ports.now(), disposed = false, busy = false;
  const caps = new Set(capabilities);
  const listeners = new Set<(view: GameView) => void>();
  const pending: Array<{run:()=>void;cancel:()=>void}> = [];
  const view = (): GameView => ({ state: structuredClone(state), ...structuredClone(projectGame(state.game, state.settings, caps)), capabilities: new Set(caps), error: structuredClone(error) });
  const emit = () => { for (const listener of [...listeners]) if (!disposed) listener(view()); };
  const perform = (operation: () => void, cancel:()=>void=()=>{}) => {
    if (disposed) {cancel();return;}
    pending.push({run:operation,cancel});
    if (busy) return;
    busy = true;
    try { while (pending.length && !disposed) pending.shift()!.run(); }
    finally { busy = false; }
  };
  const accept = (result: Transition) => {
    state = { ...state, game: result.state };
    if (result.events.some(event => event.type === 'gameOver') && state.completedRunId !== result.state.runId) {
      state = { ...state, completedRunId: result.state.runId };
    }
  };
  const sync = () => {
    const now = ports.now();
    const elapsed = Math.max(0, now - lastTime);
    lastTime = Math.max(lastTime, now);
    if (state.game.status === 'running' && elapsed > 0) accept(advanceGame(state.game, elapsed, state.settings, caps));
  };
  const unavailable = (feature: string): Outcome<void> => ({ ok: false, error: { code: 'runtime-unavailable', message: disposed ? 'This game session is closed.' : `${feature} is not available in this build.` } });
  let release = () => {};
  const controller: Controller = {
    view,
    start: () => perform(() => {
      sync();
      state = { ...state, game: createGame(ports.newSeed(), ports.newId(), state.settings, caps, 'running'), completedRunId: null };
      lastTime = ports.now(); error = null; emit();
    }),
    pause: () => perform(() => { sync(); state = { ...state, game: setPaused(state.game, true) }; emit(); }),
    resume: () => perform(() => { sync(); state = { ...state, game: setPaused(state.game, false) }; lastTime = ports.now(); emit(); }),
    action: action => perform(() => { sync(); accept(dispatchGame(state.game, action, state.settings, caps)); emit(); }),
    tick: () => perform(() => { sync(); emit(); }),
    setSettings: patch => new Promise(resolve=>perform(()=>{
      if(!caps.has('settings')){resolve(unavailable('Settings'));return;}
      const invalid:Outcome<void>={ok:false,error:{code:'invalid-data',message:'Choose correctly typed settings; the edit was not applied.'}};
      if(typeof patch!=='object'||patch===null||Array.isArray(patch)){error=invalid.error;emit();resolve(invalid);return;}
      const descriptors=Object.getOwnPropertyDescriptors(patch);
      if(Reflect.ownKeys(patch).some(key=>typeof key!=='string'||!Object.hasOwn(descriptors[key]!,'value'))){error=invalid.error;emit();resolve(invalid);return;}
      const result=validateSettings({...state.settings,...Object.fromEntries(Object.entries(descriptors).map(([key,descriptor])=>[key,descriptor.value]))});
      if(!result.ok){error=result.error;emit();resolve(result);return;}
      sync();state={...state,settings:result.value};error=null;emit();resolve({ok:true,value:undefined});
    },()=>resolve(unavailable('Settings')))),
    save: async () => unavailable('Saving'),
    restore: async () => unavailable('Restoring'),
    subscribe: listener => {
      if (disposed) return () => {};
      listeners.add(listener); listener(view());
      return () => { listeners.delete(listener); };
    },
    suspend: async () => {
      if (disposed) return unavailable('Suspending');
      controller.pause();
      try {
        const result = await ports.writeCheckpoint(structuredClone(state));
        if (!result.ok && !disposed) perform(() => { error = result.error; emit(); });
        return result;
      } catch {
        const failure: Outcome<void> = { ok: false, error: { code: 'checkpoint-failed', message: 'The paused session could not be saved.' } };
        if (!disposed) perform(() => { error = failure.error; emit(); });
        return failure;
      }
    },
    dispose: () => { if (!disposed) { disposed = true; release(); listeners.clear(); while(pending.length)pending.shift()!.cancel(); } }
  };
  release = ports.bindLifecycle(() => { void controller.suspend(); });
  return controller;
}
