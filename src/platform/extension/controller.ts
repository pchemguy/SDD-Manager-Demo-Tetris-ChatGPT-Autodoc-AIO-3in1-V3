/** Sidebar durability policy around C3; the background never receives a game clock. */
import type {Controller} from '../../application';
import type {ExtensionConnection} from './index';
import type {AppError,GameView,Outcome} from '../../models';
export interface SidebarController extends Controller{flushCheckpoint():Promise<Outcome<void>>}
export function coordinateSidebar(controller:Controller,connection:ExtensionConnection):SidebarController{
 const {ports}=connection,listeners=new Set<(v:GameView)=>void>();
 let closed=false,force=false,error:AppError|null=connection.warning,lastSignature='',lastQueued='',lastTime=ports.now(),tail:Promise<Outcome<void>>=Promise.resolve({ok:true,value:undefined});
 let failed=false;
 const view=():GameView=>{const value=controller.view();return {...value,error:failed?error:value.error??error};};
 const emit=()=>{if(!closed)for(const listener of [...listeners])listener(view());};
 const checkpoint=(v:GameView)=>{
  const signature=JSON.stringify(v.state);if(closed||failed||signature===lastQueued)return;lastQueued=signature;lastTime=ports.now();const state=structuredClone(v.state);
  tail=tail.then(async()=>{
   if(closed||failed)return failed?{ok:false,error:error!}:{ok:true,value:undefined};
   let result:Outcome<void>;try{result=await ports.writeCheckpoint(state);}catch{result={ok:false,error:{code:'checkpoint-failed',message:'The sidebar checkpoint was not acknowledged. Reopen to recover the last saved state.'}};}
   if(!result.ok&&!closed){failed=true;error=result.error;controller.pause();emit();}return result;
  });
 };
 const unsubscribe=controller.subscribe(v=>{
  const semantic=JSON.stringify({...v.state,game:{...v.state.game,timers:undefined}}),changed=semantic!==lastSignature;lastSignature=semantic;
  if(force||changed||v.state.game.status==='running'&&ports.now()-lastTime>=100)checkpoint(v);
  emit();
 });
 const command=(run:()=>void)=>{if(closed||failed)return;force=true;try{run();}finally{force=false;}};
 return {...controller,view,
  start:()=>command(()=>controller.start()),pause:()=>command(()=>controller.pause()),resume:()=>command(()=>controller.resume()),action:action=>command(()=>controller.action(action)),
  tick:()=>{if(!closed&&!failed)controller.tick();},
  subscribe:listener=>{if(closed)return()=>{};listeners.add(listener);listener(view());return()=>{listeners.delete(listener);};},
  flushCheckpoint:()=>tail,
  suspend:async()=>{command(()=>controller.pause());return tail;},
  dispose:()=>{if(closed)return;closed=true;unsubscribe();listeners.clear();controller.dispose();void tail.finally(()=>connection.release());}
 };
}
