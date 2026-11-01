/** Shared DOM/Canvas UI; the controller owns gameplay and host adapters own effects. */
import type { Controller } from '../application';
import type { GameView } from '../models';
import { createBoardRenderer } from './board';
import './style.css';
import { bindInput } from './input';
export function mountGame(root:HTMLElement, controller:Controller):()=>void {
  root.innerHTML=`<header><p class="eyebrow">KEYBOARD ARCADE · CLASSIC</p><h1>Tetris<span>01</span></h1><p>Find your rhythm. Leave no gaps.</p></header>
    <div class="game-layout"><section class="info" aria-labelledby="info-title"><p class="eyebrow">YOUR SESSION</p><h2 id="info-title">Game info and controls</h2>
    <dl><div><dt>Score</dt><dd data-testid="score">0</dd></div><div><dt>Level</dt><dd data-testid="level">1</dd></div><div><dt>Lines</dt><dd data-testid="lines">0</dd></div></dl>
    <p class="status" data-testid="status" role="status">idle</p><p class="hint">← → move · ↑ / X rotate<br>Z rotate back · ↓ soft drop<br>Esc pause / resume</p>
    <div class="game-actions"><button id="restart">Start</button><button id="pause">Start</button></div></section>
    <section class="board-wrap" aria-label="Tetris board"><canvas width="300" height="600" tabindex="0" aria-label="Game board. Use keyboard controls."></canvas><p class="board-caption">10 × 20 · CLASSIC PLAYFIELD</p></section></div>`;
  const canvas=root.querySelector('canvas')!;
  const drawBoard=createBoardRenderer(canvas);
  const set=(id:string,value:string|number)=>{const element=root.querySelector(`[data-testid="${id}"]`)!;if(element.textContent!==String(value))element.textContent=String(value);};
  const render=(view:GameView)=>{
    const g=view.state.game;
    root.querySelector('#restart')!.textContent=g.status==='idle'?'Start':'Restart';
    root.querySelector('#pause')!.textContent=g.status==='running'?'Pause':'Start';
    set('score',g.score);set('level',g.level);set('lines',g.lines);set('status',g.status);drawBoard(view);
  };
  const focus=()=>canvas.focus({preventScroll:true});
  root.querySelector('#restart')!.addEventListener('click',()=>{controller.start();focus();});
  root.querySelector('#pause')!.addEventListener('click',()=>{const status=controller.view().state.game.status;if(status==='running')controller.pause();else if(status==='paused')controller.resume();else controller.start();focus();});
  const input=bindInput(canvas,action=>controller.action(action),()=>{const s=controller.view().state.game.status;if(s==='running')controller.pause();else if(s==='paused')controller.resume();});
  const unsubscribe=controller.subscribe(view=>{if(view.state.game.status!=='running')input.clear();render(view);});let frame=0,closed=false;
  const animate=()=>{if(closed)return;controller.tick();frame=requestAnimationFrame(animate);};frame=requestAnimationFrame(animate);
  return ()=>{closed=true;cancelAnimationFrame(frame);unsubscribe();input.dispose();controller.dispose();root.replaceChildren();};
}
