/** Firefox's document background and user-gesture sidebar action share the same broker. */
import {registerBackground,type BackgroundAPI} from './background';
export interface FirefoxAPI extends BackgroundAPI{action:{onClicked:{addListener(fn:()=>void):void}};sidebarAction:{open():Promise<void>}}
export function registerFirefox(api:FirefoxAPI):void{
 registerBackground(api);
 api.action.onClicked.addListener(()=>{void api.sidebarAction.open().catch(()=>console.error('Tetris sidebar could not open. Use Firefox sidebar menu.'));});
}
