/** Shared DOM/Canvas UI; the controller owns gameplay and host adapters own effects. */
import type { Controller } from '../application';
import type { Cell, GameAction, GameView } from '../models';
import { cells } from '../domain';
import './style.css';
const colors:Record<Exclude<Cell,null>,string>={I:'#44d6df',J:'#668cff',L:'#ffae5c',O:'#f7db58',S:'#74d796',T:'#c48af5',Z:'#fa738b',penetrator:'#ffffff'};
export function mountGame(root:HTMLElement, controller:Controller):()=>void {
  root.innerHTML=`<header><p class="eyebrow">KEYBOARD ARCADE · CLASSIC</p><h1>Tetris<span>01</span></h1><p>Find your rhythm. Leave no gaps.</p></header>
    <div class="game-layout"><section class="info" aria-labelledby="info-title"><p class="eyebrow">YOUR SESSION</p><h2 id="info-title">Game info and controls</h2>
    <dl><div><dt>Score</dt><dd data-testid="score">0</dd></div><div><dt>Level</dt><dd data-testid="level">1</dd></div><div><dt>Lines</dt><dd data-testid="lines">0</dd></div></dl>
    <p class="status" data-testid="status" role="status">idle</p><p class="hint">← → move · ↑ / X rotate<br>Z rotate back · ↓ soft drop<br>Esc pause / resume</p>
    <div class="game-actions"><button id="restart">Start</button><button id="pause">Start</button></div></section>
    <section class="board-wrap" aria-label="Tetris board"><canvas width="300" height="600" tabindex="0" aria-label="Game board. Use keyboard controls."></canvas><p class="board-caption">10 × 20 · CLASSIC PLAYFIELD</p></section></div>`;
  const canvas=root.querySelector('canvas')!;
  const ctx=canvas.getContext('2d');if(!ctx) throw new Error('Canvas 2D rendering is unavailable.');
  const set=(id:string,value:string|number)=>{const element=root.querySelector(`[data-testid="${id}"]`)!;if(element.textContent!==String(value))element.textContent=String(value);};
  const block=(x:number,y:number,color:string,alpha=1)=>{
    if(y<0)return;ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.fillRect(x*30+2,y*30+2,26,26);
    ctx.fillStyle='#ffffff22';ctx.fillRect(x*30+2,y*30+2,26,3);ctx.globalAlpha=1;
  };
  const render=(view:GameView)=>{
    const g=view.state.game;
    root.querySelector('#restart')!.textContent=g.status==='idle'?'Start':'Restart';
    root.querySelector('#pause')!.textContent=g.status==='running'?'Pause':'Start';
    set('score',g.score);set('level',g.level);set('lines',g.lines);set('status',g.status);
    ctx.fillStyle='#0e1926';ctx.fillRect(0,0,300,600);ctx.strokeStyle='#203043';ctx.lineWidth=.5;
    for(let x=0;x<=10;x++){ctx.beginPath();ctx.moveTo(x*30,0);ctx.lineTo(x*30,600);ctx.stroke();}
    for(let y=0;y<=20;y++){ctx.beginPath();ctx.moveTo(0,y*30);ctx.lineTo(300,y*30);ctx.stroke();}
    g.board.forEach((row,y)=>row.forEach((cell,x)=>{if(cell)block(x,y,colors[cell]);}));
    if(view.ghost)for(const {x,y}of cells(view.ghost))block(x,y,colors[view.ghost.kind],.22);
    if(g.active)for(const {x,y}of cells(g.active))block(x,y,colors[g.active.penetrator?'penetrator':g.active.kind]);
    if(g.status!=='running'){
      ctx.fillStyle='#07101bd9';ctx.fillRect(0,230,300,130);ctx.fillStyle='#edf5ff';ctx.font='600 24px system-ui';ctx.textAlign='center';
      ctx.fillText(g.status==='idle'?'Ready to play?':g.status==='paused'?'Paused':'Game over',150,282);
      ctx.font='13px system-ui';ctx.fillStyle='#a7b9ce';ctx.fillText(g.status==='paused'?'Press Esc to resume':'Choose Start/Restart to begin',150,313);
    }
  };
  const focus=()=>canvas.focus({preventScroll:true});
  root.querySelector('#restart')!.addEventListener('click',()=>{controller.start();focus();});
  root.querySelector('#pause')!.addEventListener('click',()=>{const status=controller.view().state.game.status;if(status==='running')controller.pause();else if(status==='paused')controller.resume();else controller.start();focus();});
  const keys:Record<string,GameAction>={ArrowLeft:'left',ArrowRight:'right',ArrowDown:'softDrop',ArrowUp:'rotateCW',x:'rotateCW',z:'rotateCCW'};
  const keydown=(event:KeyboardEvent)=>{
    if(event.target instanceof HTMLElement && event.target.closest('button,input,select,textarea'))return;
    const key=event.key.length===1?event.key.toLowerCase():event.key;
    if(key==='Escape'){event.preventDefault();if(event.repeat)return;const s=controller.view().state.game.status;if(s==='running')controller.pause();else if(s==='paused')controller.resume();}
    else if(keys[key]){event.preventDefault();controller.action(keys[key]);}
  };
  document.addEventListener('keydown',keydown);
  const unsubscribe=controller.subscribe(render);let frame=0,closed=false;
  const animate=()=>{if(closed)return;controller.tick();frame=requestAnimationFrame(animate);};frame=requestAnimationFrame(animate);
  return ()=>{closed=true;cancelAnimationFrame(frame);unsubscribe();document.removeEventListener('keydown',keydown);controller.dispose();root.replaceChildren();};
}
