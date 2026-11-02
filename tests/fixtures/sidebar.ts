/** Test-only native-API recorder. Web Storage simulates extension storage lifetimes. */
import {startSidebar} from '../../src/entry/sidebar';
import {createCoordinator,type StorageArea} from '../../src/platform/extension/session';
function storage(host:Storage,prefix:string):StorageArea{return {get:async key=>({[key]:JSON.parse(host.getItem(prefix+key)??'null')??undefined}),set:async values=>{if(sessionStorage.getItem('fail-checkpoint')==='1'&&prefix==='session:')throw Error('injected failure');for(const [key,value]of Object.entries(values))host.setItem(prefix+key,JSON.stringify(value));},remove:async key=>host.removeItem(prefix+key)};}
const coordinator=createCoordinator(storage(sessionStorage,'session:'),{id:'fixture',url:'fixture://sidebar',windowExists:async id=>id===7});
export const session=await startSidebar(document.querySelector<HTMLElement>('#app')!,{runtime:{sendMessage:message=>coordinator.handle(message,{id:'fixture',url:'fixture://sidebar'})},windows:{getCurrent:async()=>({id:7})},storage:{local:storage(localStorage,'local:')}});
Object.assign(window,{sidebarFixture:session});
