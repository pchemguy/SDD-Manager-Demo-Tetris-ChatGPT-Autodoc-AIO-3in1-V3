/** Canvas-only presentation: settled/active cells and non-mutating outlined landing. */
import type { Cell,GameView } from '../models';
import { cells } from '../domain';
const colors:Record<Exclude<Cell,null>,string>={I:'#44d6df',J:'#668cff',L:'#ffae5c',O:'#f7db58',S:'#74d796',T:'#c48af5',Z:'#fa738b',penetrator:'#ffffff'};
export function createBoardRenderer(canvas:HTMLCanvasElement):(view:GameView)=>void {
  const ctx=canvas.getContext('2d');if(!ctx) throw new Error('Canvas 2D rendering is unavailable.');
  const block=(x:number,y:number,color:string,alpha=1)=>{
    if(y<0)return;ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.fillRect(x*30+2,y*30+2,26,26);
    ctx.fillStyle='#ffffff22';ctx.fillRect(x*30+2,y*30+2,26,3);ctx.globalAlpha=1;
  };
  return (view:GameView)=>{
    const g=view.state.game;
    ctx.fillStyle='#0e1926';ctx.fillRect(0,0,300,600);ctx.strokeStyle='#203043';ctx.lineWidth=.5;
    for(let x=0;x<=10;x++){ctx.beginPath();ctx.moveTo(x*30,0);ctx.lineTo(x*30,600);ctx.stroke();}
    for(let y=0;y<=20;y++){ctx.beginPath();ctx.moveTo(0,y*30);ctx.lineTo(300,y*30);ctx.stroke();}
    g.board.forEach((row,y)=>row.forEach((cell,x)=>{if(cell)block(x,y,colors[cell]);}));
    if(view.ghost){ctx.globalAlpha=.45;ctx.strokeStyle=colors[view.ghost.penetrator?'penetrator':view.ghost.kind];ctx.lineWidth=1;for(const {x,y}of cells(view.ghost)){if(y>=0)ctx.strokeRect(x*30+.5,y*30+.5,29,29);}ctx.globalAlpha=1;}
    if(g.active)for(const {x,y}of cells(g.active))block(x,y,colors[g.active.penetrator?'penetrator':g.active.kind]);
    if(g.status!=='running'){
      ctx.fillStyle='#07101bd9';ctx.fillRect(0,230,300,130);ctx.fillStyle='#edf5ff';ctx.font='600 24px system-ui';ctx.textAlign='center';
      ctx.fillText(g.status==='idle'?'Ready to play?':g.status==='paused'?'Paused':'Game over',150,282);
      ctx.font='13px system-ui';ctx.fillStyle='#a7b9ce';ctx.fillText(g.status==='paused'?'Press Esc to resume':'Choose Start/Restart to begin',150,313);
    }
  };
}
