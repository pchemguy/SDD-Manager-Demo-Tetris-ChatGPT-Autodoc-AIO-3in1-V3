/** Shared sidebar entry: acquire acknowledged state before composing the compact page. */
import {createController} from '../application';
import {createGame} from '../domain';
import {connectExtension,type ExtensionAPI} from '../platform/extension';
import {coordinateSidebar} from '../platform/extension/controller';
import {DEFAULT_SETTINGS} from '../rules';
import {CAPABILITIES} from '../capabilities';
import {mount} from '../ui';
export async function startSidebar(root:HTMLElement,api:ExtensionAPI,host:Window=window){
 const acquired=await connectExtension(api,host);
 if(!acquired.ok){root.replaceChildren();const error=root.ownerDocument.createElement('p');error.setAttribute('role','alert');error.textContent=acquired.error.message;root.append(error);return null;}
 const connection=acquired.value,{ports}=connection,loaded=await ports.loadCheckpoint();
 const initial=loaded.ok&&loaded.value?loaded.value.state:{game:createGame(ports.newSeed(),ports.newId(),DEFAULT_SETTINGS,CAPABILITIES,'idle'),settings:DEFAULT_SETTINGS,results:[],completedRunId:null};
 const controller=coordinateSidebar(createController(initial,{...ports,bindLifecycle:()=>()=>{}},CAPABILITIES),connection);
 const unbind=ports.bindLifecycle(()=>{void controller.suspend();}),unmount=mount(root,controller,'sidebar');
 let closed=false;const dispose=()=>{if(closed)return;closed=true;unbind();host.removeEventListener('pagehide',dispose);unmount();};
 host.addEventListener('pagehide',dispose);return {controller,dispose};
}
const platform=globalThis as typeof globalThis&{browser?:ExtensionAPI;chrome?:ExtensionAPI};
if(typeof document!=='undefined'&&(platform.browser||platform.chrome))void startSidebar(document.querySelector<HTMLElement>('#app')!,platform.browser??platform.chrome!);
