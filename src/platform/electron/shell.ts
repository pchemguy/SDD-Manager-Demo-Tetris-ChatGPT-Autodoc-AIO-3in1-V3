/** Native host composition; no renderer Node integration, preload bridge or network server. */
import type * as Electron from 'electron';
import {APP_ORIGIN,createOriginHandler} from './origin';
export type DesktopHost=Pick<typeof Electron,'app'|'protocol'|'session'|'BrowserWindow'|'Menu'|'dialog'>;
/** Register privileges before readiness, then bind the handler to the actual persistent window session. */
export async function launchDesktop(host:DesktopHost,assetRoot:string):Promise<Electron.BrowserWindow|null>{
 try{
  host.app.enableSandbox();
  host.protocol.registerSchemesAsPrivileged([{scheme:'app',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true,bypassCSP:false,allowServiceWorkers:false}}]);
  await host.app.whenReady();
  const handler=await createOriginHandler(assetRoot),session=host.session.fromPartition('persist:tetris');
  session.protocol.handle('app',request=>handler(request));
  session.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));session.setPermissionCheckHandler(()=>false);
  session.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*']},(_details,callback)=>callback({cancel:true}));
  host.Menu.setApplicationMenu(null);
  const window=new host.BrowserWindow({title:'Tetris',width:1440,height:1000,minWidth:320,minHeight:400,backgroundColor:'#080f19',show:false,webPreferences:{session,nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,allowRunningInsecureContent:false,webviewTag:false,devTools:false}});
  window.webContents.on('will-navigate',event=>event.preventDefault());window.webContents.on('will-attach-webview',event=>event.preventDefault());window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  host.app.on('window-all-closed',()=>host.app.quit());
  await window.loadURL(APP_ORIGIN+'/');window.show();return window;
 }catch{
  host.dialog.showErrorBox('Tetris could not start','The bundled application assets could not be loaded safely. Re-extract the complete release into an empty directory.');host.app.quit();return null;
 }
}
