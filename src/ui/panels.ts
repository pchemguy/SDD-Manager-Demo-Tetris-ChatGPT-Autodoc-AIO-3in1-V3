/** Settings presentation reads coherent views and sends typed edits to the controller. */
import type {Controller} from '../application';
import type {GameView,SettingKey,SettingPatch} from '../models';
const toggles:ReadonlyArray<readonly [string,string]>=[['true','Enabled'],['false','Disabled']];
const definitions:ReadonlyArray<{key:SettingKey;label:string;options:ReadonlyArray<readonly [string,string]>;boolean?:boolean}>=[
 {key:'ghost',label:'Ghost',options:[['hide','Hide'],['dynamic','Dynamic (lower half)'],['show','Show']]},
 {key:'hardDrop',label:'Hard drop',options:toggles,boolean:true},
 {key:'nextPreview',label:'Next preview',options:toggles,boolean:true},
 {key:'hardDropLock',label:'Hard drop lock',options:[['general','General policy'],['immediate','Immediate']]},
 {key:'lockPolicy',label:'Lock policy',options:[['failed','Failed step'],['interval','Full interval']]},
 {key:'hold',label:'Hold',options:toggles,boolean:true}
];
/** Own only these DOM listeners; mount owns the controller subscription/lifetime. */
export function createSettingsPanel(controller:Controller){
 const element=document.createElement('section');element.className='settings-panel';element.setAttribute('aria-labelledby','settings-title');
 element.innerHTML=`<p class="eyebrow">MAKE IT YOURS</p><h2 id="settings-title">${controller.view().capabilities.has('persistentSettings')?'Settings':'Session settings'}</h2>${definitions.map(d=>`<label for="setting-${d.key}">${d.label}</label><select id="setting-${d.key}">${d.options.map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}</select>`).join('')}<p class="hint" data-testid="policy-hint"></p><p class="hint" data-testid="storage-hint">${controller.view().capabilities.has('persistentSettings')?'Settings are saved in this browser.':'Settings last until this page reloads.'}</p><p role="alert" class="error" hidden></p>`;
 const cleanups:Array<()=>void>=[];
 for(const definition of definitions){
  const select=element.querySelector<HTMLSelectElement>(`#setting-${definition.key}`)!;
  const change=()=>{const value=definition.boolean?select.value==='true':select.value;void controller.setSettings({[definition.key]:value} as SettingPatch);};
  select.addEventListener('change',change);cleanups.push(()=>select.removeEventListener('change',change));
 }
 return {element,render(view:GameView){
  for(const definition of definitions){const select=element.querySelector<HTMLSelectElement>(`#setting-${definition.key}`)!,value=String(view.state.settings[definition.key]);if(select.value!==value)select.value=value;}
  const selected=view.state.settings,current=view.state.game.piecePolicy;
  const pending=view.state.game.active&&(selected.lockPolicy!==current.lockPolicy||selected.hardDropLock!==current.hardDropLock);
  const hint=element.querySelector('[data-testid=policy-hint]')!;
  const text=pending?`Pending until next piece: ${selected.lockPolicy==='interval'?'full interval':'failed step'} / ${selected.hardDropLock==='general'?'general':'immediate'} hard drop. Current piece keeps its policies and deadline.`:'Lock policies apply to each new piece.';
  if(hint.textContent!==text)hint.textContent=text;
  const storage=element.querySelector('[data-testid=storage-hint]')!;const storageText=view.capabilities.has('persistentSettings')?(view.error?.code==='persistence-failed'?'These selections may not be saved. See the error below.':'Settings are saved in this browser.'):'Settings last until this page reloads.';if(storage.textContent!==storageText)storage.textContent=storageText;
  const error=element.querySelector<HTMLElement>('[role=alert]')!;error.hidden=!view.error;if(error.textContent!==(view.error?.message??''))error.textContent=view.error?.message??'';
 },dispose(){for(const cleanup of cleanups)cleanup();}};
}
