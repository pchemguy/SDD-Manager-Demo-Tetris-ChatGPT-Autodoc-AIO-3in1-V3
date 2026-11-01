/** Shared DOM/Canvas UI; the controller owns gameplay and host adapters own effects. */
import type { Controller } from '../application';
import type { GameView } from '../models';
import { createBoardRenderer } from './board';
import './style.css';
import { bindInput } from './input';
import { renderPreview } from './preview';
import { createLeaderboardPanel, createSettingsPanel } from './panels';
export function mount(root:HTMLElement, controller:Controller, mode:'wide'|'sidebar'='wide'):()=>void {
  root.dataset.mode=mode;const capabilities=controller.view().capabilities,modern=capabilities.has('modern'),penetrator=capabilities.has('penetrator');
  root.innerHTML=`<header><p class="eyebrow">KEYBOARD ARCADE · ${modern?'MODERN':'CLASSIC'}</p><h1>Tetris<span aria-hidden="true">${modern?'02':'01'}</span></h1><p>Find your rhythm. Leave no gaps.</p></header>
    <div class="game-layout"><section class="info" aria-labelledby="info-title"><p class="eyebrow">YOUR SESSION</p><h2 id="info-title">Game info and controls</h2>
    <dl><div><dt>Score</dt><dd data-testid="score">0</dd></div><div><dt>Level</dt><dd data-testid="level">1</dd></div><div><dt>Lines</dt><dd data-testid="lines">0</dd></div></dl>
    ${modern?'<div class="piece-slots"><section><h3>Next <span data-testid="next-kind">—</span></h3><div class="mini-piece" id="next-preview"></div></section><section><h3>Hold <span data-testid="held-kind">—</span></h3><div class="mini-piece" id="held-preview"></div><p data-testid="hold-state">Available</p></section></div>':''}
    ${penetrator?'<section class="bonus-inventory" aria-label="Penetrator bonuses"><h3>Penetrator <span data-testid="bonus-count">0</span></h3><p class="bonuses" data-testid="bonuses" aria-label="No bonuses"></p></section>':''}
    <p class="status" data-testid="status" role="status">idle</p><p class="hint">← → move · ↑ / X rotate<br>Z rotate back · ↓ soft drop<br>${modern?'<span data-testid="modern-actions">Space hard drop · C hold</span><br>':''}${penetrator?'P activates penetrator (1 bonus)<br>':''}Esc pause / resume</p><p class="hint" data-testid="lock-info">Full grounding interval; pause freezes timers.</p>${penetrator?'<p class="hint">Four cleared lines earn one ⚡ (max 3). Hold is unavailable while active.</p>':''}
    <div class="game-actions"><button id="restart">Start</button><button id="pause">Start</button></div></section>
    <section class="board-wrap" aria-label="Tetris board"><canvas width="300" height="600" tabindex="0" aria-label="Game board. Use keyboard controls."></canvas><p class="board-caption">10 × 20 · PLAYFIELD</p></section></div>`;
  const leaderboardPanel=capabilities.has('leaderboard')?createLeaderboardPanel():null;
  if(leaderboardPanel)root.querySelector('.game-layout')!.prepend(leaderboardPanel.element);
  const settingsPanel=capabilities.has('settings')?createSettingsPanel(controller):null;
  if(settingsPanel)root.querySelector('.game-layout')!.append(settingsPanel.element);
  const canvas=root.querySelector('canvas')!;
  const drawBoard=createBoardRenderer(canvas);
  const set=(id:string,value:string|number)=>{const element=root.querySelector(`[data-testid="${id}"]`)!;if(element.textContent!==String(value))element.textContent=String(value);};
  const render=(view:GameView)=>{
    const g=view.state.game;
    root.querySelector('#restart')!.textContent=g.status==='idle'?'Start':'Restart';
    root.querySelector('#pause')!.textContent=g.status==='running'?'Pause':'Start';
    set('score',g.score);set('level',g.level);set('lines',g.lines);set('status',g.status);
    const policy=g.active?g.piecePolicy:view.state.settings;
    set('lock-info',`${g.active?'Current':'Next'} piece: ${policy.lockPolicy==='interval'?'full interval':'failed step'} / ${policy.hardDropLock==='general'?'general':'immediate'} hard drop. Pause freezes timers.`);
    if(modern){set('modern-actions',`Space hard drop${view.state.settings.hardDrop?'':' (disabled)'} · C hold${view.state.settings.hold?'':' (disabled)'}`);root.querySelector<HTMLElement>('#next-preview')!.hidden=!view.state.settings.nextPreview;set('next-kind',view.state.settings.nextPreview?view.next??'—':'Disabled');set('held-kind',view.held??'—');set('hold-state',g.active?.penetrator?'Unavailable (penetrator)':!view.state.settings.hold?'Disabled':g.holdUsed?'Used until lock':'Available');renderPreview(root.querySelector('#next-preview')!,view.next,'Next');renderPreview(root.querySelector('#held-preview')!,view.held,'Hold');}
    if(penetrator){set('bonus-count',g.bonuses);set('bonuses','⚡'.repeat(g.bonuses));const inventory=root.querySelector('[data-testid=bonuses]')!;const label=`${g.bonuses} penetrator bonuses`;if(inventory.getAttribute('aria-label')!==label)inventory.setAttribute('aria-label',label);}
    leaderboardPanel?.render(view);settingsPanel?.render(view);drawBoard(view);
  };
  const focus=()=>{canvas.focus({preventScroll:true});canvas.scrollIntoView({block:'center',inline:'nearest'});};
  root.querySelector('#restart')!.addEventListener('click',()=>{controller.start();focus();});
  root.querySelector('#pause')!.addEventListener('click',()=>{const status=controller.view().state.game.status;if(status==='running')controller.pause();else if(status==='paused')controller.resume();else controller.start();focus();});
  const input=bindInput(canvas,action=>controller.action(action),()=>{const s=controller.view().state.game.status;if(s==='running')controller.pause();else if(s==='paused')controller.resume();});
  const unsubscribe=controller.subscribe(view=>{if(view.state.game.status!=='running')input.clear();render(view);});let frame=0,closed=false;
  const animate=()=>{if(closed)return;controller.tick();frame=requestAnimationFrame(animate);};frame=requestAnimationFrame(animate);
  return ()=>{closed=true;cancelAnimationFrame(frame);unsubscribe();input.dispose();settingsPanel?.dispose();controller.dispose();root.replaceChildren();};
}
