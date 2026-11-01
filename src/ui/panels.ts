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
/** Manual file controls own bounded file reads and listeners; C3 owns data and serialization. */
function createFileControls(controller:Controller){
 const element=document.createElement('section');element.className='file-controls';element.setAttribute('aria-label','Manual snapshot files');
 element.innerHTML='<h3>Manual snapshots</h3><label for="save-format">Save format</label><select id="save-format"><option value="json">JSON</option><option value="sqlite">SQLite</option></select><div class="file-actions"><button type="button" id="file-save">Save</button><button type="button" id="file-restore">Restore</button></div><input type="file" accept=".json,.sqlite,.sqlite3,.db,application/json,application/vnd.sqlite3" hidden><p class="hint">Only the session top ten and selected settings. Resume explicitly after file interaction.</p><p class="hint" data-file-status aria-live="polite"></p>';
 const save=element.querySelector<HTMLButtonElement>('#file-save')!,restore=element.querySelector<HTMLButtonElement>('#file-restore')!,format=element.querySelector<HTMLSelectElement>('#save-format')!,input=element.querySelector<HTMLInputElement>('input')!,status=element.querySelector<HTMLElement>('[data-file-status]')!;
 let closed=false,pending=false;
 const perform=async(operation:()=>Promise<import('../models').Outcome<void>>,success:string)=>{
  if(closed||pending)return;pending=true;save.disabled=true;restore.disabled=true;format.disabled=true;status.textContent='Processing snapshot…';
  try{const result=await operation();if(!closed)status.textContent=result.ok?success:'See the file error below.';}
  catch{if(!closed)status.textContent='The selected file could not be read. No snapshot was loaded.';}
  finally{if(!closed){pending=false;save.disabled=false;restore.disabled=false;format.disabled=false;input.value='';}}
 };
 const saving=()=>{void perform(()=>controller.save(format.value==='sqlite'?'sqlite':'json'),'Download requested.');};
 const choosing=()=>{if(closed||pending)return;controller.pause();input.value='';try{input.click();}catch{status.textContent='The file chooser could not be opened.';}};
 const reading=()=>{const file=input.files?.[0];if(!file||closed)return;void perform(async()=>{const bytes=new Uint8Array(await file.slice(0,4*1024*1024+1).arrayBuffer());if(closed)return {ok:false,error:{code:'stale-session',message:'This file panel is closed.'}};return controller.restore({name:file.name,bytes});},'Snapshot restored.');};
 save.addEventListener('click',saving);restore.addEventListener('click',choosing);input.addEventListener('change',reading);
 return {element,dispose(){closed=true;save.removeEventListener('click',saving);restore.removeEventListener('click',choosing);input.removeEventListener('change',reading);}};
}
/** Own only these DOM listeners; mount owns the controller subscription/lifetime. */
export function createSettingsPanel(controller:Controller){
 const element=document.createElement('section');element.className='settings-panel';element.setAttribute('aria-labelledby','settings-title');
 element.innerHTML=`<p class="eyebrow">MAKE IT YOURS</p><h2 id="settings-title">${controller.view().capabilities.has('persistentSettings')?'Settings':'Session settings'}</h2>${definitions.map(d=>`<label for="setting-${d.key}">${d.label}</label><select id="setting-${d.key}">${d.options.map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}</select>`).join('')}<p class="hint" data-testid="policy-hint"></p><p class="hint" data-testid="storage-hint">${controller.view().capabilities.has('persistentSettings')?'Settings are saved in this browser.':'Settings last until this page reloads.'}</p><p role="alert" class="error" hidden></p>`;
 const files=controller.view().capabilities.has('files')?createFileControls(controller):null;
 if(files)element.querySelector('[data-testid=storage-hint]')!.before(files.element);
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
 },dispose(){files?.dispose();for(const cleanup of cleanups)cleanup();}};
}

/** Read-only session ranking; rebuild rows only when result content changes, never on every frame. */
export function createLeaderboardPanel(){
 const element=document.createElement('section');element.className='leaderboard-panel';element.setAttribute('aria-labelledby','leaderboard-title');
 element.innerHTML='<p class="eyebrow">THIS PAGE SESSION</p><h2 id="leaderboard-title">Session top ten</h2><p class="hint" data-empty>No completed games yet.</p><ol aria-label="Completed games"></ol><p class="hint">Restart keeps this list. Reload ends the session.</p>';
 const list=element.querySelector('ol')!,empty=element.querySelector<HTMLElement>('[data-empty]')!;let signature='';
 return {element,render(view:GameView){
  const next=JSON.stringify(view.state.results);if(signature===next)return;signature=next;empty.hidden=view.state.results.length>0;
  list.replaceChildren(...view.state.results.map(result=>{
   const row=document.createElement('li');row.dataset.resultId=result.id;
   const score=document.createElement('strong');score.dataset.resultScore='';score.textContent=String(result.score);score.className=score.textContent.length>12?'long-score':'';
   const stamp=document.createElement('time');stamp.dateTime=result.timestamp;stamp.textContent=result.timestamp;
   row.append(score,stamp);return row;
  }));
 }};
}
