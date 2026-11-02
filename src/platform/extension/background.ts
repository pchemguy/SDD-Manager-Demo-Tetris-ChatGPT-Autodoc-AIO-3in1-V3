/** Native background event composition; deliberately no gameplay or timers. */
import {createCoordinator,type Sender,type SessionReply,type StorageArea} from './session';
export interface BackgroundAPI{
 runtime:{id:string;getURL(path:string):string;onMessage:{addListener(listener:(message:unknown,sender:Sender,reply:(value:SessionReply)=>void)=>true):void}};
 storage:{session:StorageArea};
 windows:{get(id:number):Promise<unknown>;onRemoved:{addListener(listener:(id:number)=>void):void}};
}
export function registerBackground(api:BackgroundAPI):void{
 const coordinator=createCoordinator(api.storage.session,{id:api.runtime.id,url:api.runtime.getURL('sidebar.html'),windowExists:async id=>{try{await api.windows.get(id);return true;}catch{return false;}}});
 api.runtime.onMessage.addListener((message,sender,reply)=>{void coordinator.handle(message,sender).then(reply);return true;});
 api.windows.onRemoved.addListener(id=>{void coordinator.clearWindow(id);});
}
