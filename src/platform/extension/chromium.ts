/** Chromium action opens the declared global side panel on a native user gesture. */
import {registerBackground,type BackgroundAPI} from './background';
export interface ChromiumAPI extends BackgroundAPI{sidePanel:{setPanelBehavior(value:{openPanelOnActionClick:boolean}):Promise<void>}}
export function registerChromium(api:ChromiumAPI):void{
 registerBackground(api);
 void api.sidePanel.setPanelBehavior({openPanelOnActionClick:true}).catch(()=>console.error('Tetris sidebar action could not be configured. Use the browser side-panel menu.'));
}
