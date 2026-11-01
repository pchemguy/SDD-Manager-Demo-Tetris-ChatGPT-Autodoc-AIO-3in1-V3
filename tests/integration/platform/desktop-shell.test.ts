/** Execute the shell against a native-host recorder; this is distinct from native launch acceptance. */
import {expect,test,vi} from 'vitest';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {launchDesktop,type DesktopHost} from '../../../src/platform/electron/shell';
import {desktopFixture} from './desktop-fixture';
function recorder(){
 const trace:string[]=[],windows:Array<InstanceType<typeof Window>>=[];
 const session={protocol:{handle:vi.fn(()=>{trace.push('handle');})},setPermissionRequestHandler:vi.fn(),setPermissionCheckHandler:vi.fn(),webRequest:{onBeforeRequest:vi.fn()}};
 class Window{options:Record<string,unknown>;webContents={on:vi.fn(),setWindowOpenHandler:vi.fn()};loadURL=vi.fn(async(url:string)=>{trace.push('load:'+url);});show=vi.fn(()=>trace.push('show'));constructor(options:Record<string,unknown>){this.options=options;windows.push(this);trace.push('window');}}
 const native={app:{enableSandbox:vi.fn(()=>trace.push('sandbox')),whenReady:vi.fn(async()=>{trace.push('ready');}),on:vi.fn(),quit:vi.fn()},protocol:{registerSchemesAsPrivileged:vi.fn(()=>trace.push('scheme'))},session:{fromPartition:vi.fn(()=>{trace.push('session');return session;})},BrowserWindow:Window,Menu:{setApplicationMenu:vi.fn()},dialog:{showErrorBox:vi.fn()}};
 return {native,host:native as unknown as DesktopHost,session,trace,windows};
}
test('registers secure standard scheme before readiness on the actual persistent window session',async()=>{
 const f=await desktopFixture(),r=recorder();try{const window=await launchDesktop(r.host,f.root);expect(window).toBe(r.windows[0]);expect(r.trace.indexOf('scheme')).toBeLessThan(r.trace.indexOf('ready'));expect(r.trace.indexOf('sandbox')).toBeLessThan(r.trace.indexOf('ready'));expect(r.trace.indexOf('handle')).toBeLessThan(r.trace.indexOf('window'));expect(r.trace.indexOf('window')).toBeLessThan(r.trace.indexOf('load:app://tetris/'));expect(r.native.session.fromPartition).toHaveBeenCalledWith('persist:tetris');
 const scheme=r.native.protocol.registerSchemesAsPrivileged.mock.calls[0] as unknown as [Array<{scheme:string;privileges:Record<string,boolean>}>];expect(scheme[0][0]!.scheme).toBe('app');expect(scheme[0][0]!.privileges).toMatchObject({standard:true,secure:true,supportFetchAPI:true,corsEnabled:true});expect(scheme[0][0]!.privileges.bypassCSP).not.toBe(true);
 const preferences=r.windows[0]!.options.webPreferences as Record<string,unknown>;expect(preferences).toMatchObject({session:r.session,nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,allowRunningInsecureContent:false,webviewTag:false});expect(preferences.preload).toBeUndefined();expect(r.windows[0]!.show).toHaveBeenCalledOnce();}finally{await f.cleanup();}
});
test('blocks navigation/popups/network/permissions and ends the desktop session on close',async()=>{
 const f=await desktopFixture(),r=recorder();try{await launchDesktop(r.host,f.root);const contents=r.windows[0]!.webContents,navigate=contents.on.mock.calls.find(([name])=>name==='will-navigate')![1],event={preventDefault:vi.fn()};navigate(event);expect(event.preventDefault).toHaveBeenCalledOnce();expect(contents.setWindowOpenHandler.mock.calls[0]![0]({url:'https://foreign.invalid'})).toEqual({action:'deny'});
 const permission=vi.fn();r.session.setPermissionRequestHandler.mock.calls[0]![0](null,'media',permission);expect(permission).toHaveBeenCalledWith(false);expect(r.session.setPermissionCheckHandler.mock.calls[0]![0]()).toBe(false);
 const blocked=vi.fn(),request=r.session.webRequest.onBeforeRequest.mock.calls[0]!;expect(request[0].urls).toContain('https://*/*');request[1]({url:'https://foreign.invalid'},blocked);expect(blocked).toHaveBeenCalledWith({cancel:true});r.native.app.on.mock.calls.find(([name])=>name==='window-all-closed')![1]();expect(r.native.app.quit).toHaveBeenCalledOnce();}finally{await f.cleanup();}
});
test('corrupt local assets cause a clear startup failure without a window or permissive fallback',async()=>{
 const f=await desktopFixture(),r=recorder();try{await writeFile(join(f.root,'assets/main.js'),'corrupted');expect(await launchDesktop(r.host,f.root)).toBeNull();expect(r.windows).toHaveLength(0);expect(r.native.dialog.showErrorBox).toHaveBeenCalledOnce();expect(r.native.app.quit).toHaveBeenCalledOnce();expect(r.session.protocol.handle).not.toHaveBeenCalled();}finally{await f.cleanup();}
});
