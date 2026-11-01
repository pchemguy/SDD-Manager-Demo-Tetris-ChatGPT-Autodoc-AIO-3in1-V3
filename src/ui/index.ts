/** Shared DOM/Canvas UI; the controller owns gameplay and host adapters own effects. */
import type { Controller } from '../application';
import type { GameView } from '../models';
import { createBoardRenderer } from './board';
import './style.css';
import { bindInput } from './input';
import { renderPreview } from './preview';
export function mount(root:HTMLElement, controller:Controller, mode:'wide'|'sidebar'='wide'):()=>void {
  root.dataset.mode=mode;const modern=controller.view().capabilities.has('modern');
  root.innerHTML=`<header><p class="eyebrow">KEYBOARD ARCADE · ${modern?'MODERN':'CLASSIC'}</p><h1>Tetris<span aria-hidden="true">${modern?'02':'01'}</span></h1><p>Find your rhythm. Leave no gaps.</p></header>
    <div class="game-layout"><section class="info" aria-labelledby="info-title"><p class="eyebrow">YOUR SESSION</p><h2 id="info-title">Game info and controls</h2>
    <dl><div><dt>Score</dt><dd data-testid="score">0</dd></div><div><dt>Level</dt><dd data-testid="level">1</dd></div><div><dt>Lines</dt><dd data-testid="lines">0</dd></div></dl>
    ${modern?'<div class="piece-slots"><section><h3>Next <span data-testid="next-kind">—</span></h3><div class="mini-piece" id="next-preview"></div></section><section><h3>Hold <span data-testid="held-kind">—</span></h3><div class="mini-piece" id="held-preview"></div><p data-testid="hold-state">Available</p></section></div>':''}
    <p class="status" data-testid="status" role="status">idle</p><p class="hint">← → move · ↑ / X rotate<br>Z rotate back · ↓ soft drop<br>${modern?'Space hard drop · C hold<br>':''}Esc pause / resume</p><p class="hint" data-testid="lock-info">Full grounding interval; pause freezes timers.</p>
    <div class="game-actions"><button id="restart">Start</button><button id="pause">Start</button></div></section>
    <section class="board-wrap" aria-label="Tetris board"><canvas width="300" height="600" tabindex="0" aria-label="Game board. Use keyboard controls."></canvas><p class="board-caption">10 × 20 · PLAYFIELD</p></section></div>`;
  const canvas=root.querySelector('canvas')!;
  const drawBoard=createBoardRenderer(canvas);
  const set=(id:string,value:string|number)=>{const element=root.querySelector(`[data-testid="${id}"]`)!;if(element.textContent!==String(value))element.textContent=String(value);};
  const render=(view:GameView)=>{
    const g=view.state.game;
    root.querySelector('#restart')!.textContent=g.status==='idle'?'Start':'Restart';
    root.querySelector('#pause')!.textContent=g.status==='running'?'Pause':'Start';
    set('score',g.score);set('level',g.level);set('lines',g.lines);set('status',g.status);
    if(modern){set('next-kind',view.next??'—');set('held-kind',view.held??'—');set('hold-state',!view.state.settings.hold?'Disabled':g.holdUsed?'Used until lock':'Available');renderPreview(root.querySelector('#next-preview')!,view.next,'Next');renderPreview(root.querySelector('#held-preview')!,view.held,'Hold');}
    drawBoard(view);
  };
  const focus=()=>canvas.focus({preventScroll:true});
  root.querySelector('#restart')!.addEventListener('click',()=>{controller.start();focus();});
  root.querySelector('#pause')!.addEventListener('click',()=>{const status=controller.view().state.game.status;if(status==='running')controller.pause();else if(status==='paused')controller.resume();else controller.start();focus();});
  const input=bindInput(canvas,action=>controller.action(action),()=>{const s=controller.view().state.game.status;if(s==='running')controller.pause();else if(s==='paused')controller.resume();});
  const unsubscribe=controller.subscribe(view=>{if(view.state.game.status!=='running')input.clear();render(view);});let frame=0,closed=false;
  const animate=()=>{if(closed)return;controller.tick();frame=requestAnimationFrame(animate);};frame=requestAnimationFrame(animate);
  return ()=>{closed=true;cancelAnimationFrame(frame);unsubscribe();input.dispose();controller.dispose();root.replaceChildren();};
}
