/** Test-only public controller/mount consumer; never included in release build inputs. */
import { createGame } from '../../src/domain';
import { createController } from '../../src/application';
import { createBrowserPorts } from '../../src/platform/browser';
import { mount } from '../../src/ui';
import type { Capabilities,Cell,GameState,PieceKind,Settings } from '../../src/models';
const settings:Settings={ghost:'show',hardDrop:true,nextPreview:true,hardDropLock:'general',lockPolicy:'interval',hold:true};
const capabilities:Capabilities=new Set(['modern','penetrator','settings']);
const board=Array.from({length:20},()=>Array<Cell>(10).fill(null));
for(const [x,kind]of (['I','J','L','O','S','T','Z'] as PieceKind[]).entries())board[19]![x]=kind;
board[19]![9]='penetrator';board[5]![4]='J';
const scenario=new URLSearchParams(location.search).get('case');
if(scenario==='activation'){for(const row of board)row.fill(null);board[8]![4]='J';board[8]![5]='J';board[19]![4]='J';}
if(scenario==='award'){for(const row of board)row.fill(null);for(let y=16;y<20;y++){board[y]!.fill('J');board[y]![4]=null;}board[10]![4]='J';board[10]![5]='J';}
let game:GameState={...createGame(123,'render-fixture',settings,capabilities,'running'),board,bonuses:1,active:{kind:'O' as const,rotation:0 as const,origin:{x:4,y:5},penetrator:true}};
if(scenario==='activation')game={...game,held:'I',bonuses:3,active:{...game.active!,penetrator:false}};
if(scenario==='award')game={...game,bonuses:0,active:{kind:'I',rotation:1,origin:{x:2,y:12},penetrator:false},sequence:{...game.sequence,pending:['O','J','L','S','T','Z']},timers:{gravityRemainingMs:1000,lockRemainingMs:null,grounded:false}};
if(scenario==='session')game=createGame(123,'session-fixture',settings,capabilities,'idle');
if(scenario==='ghost'){const floor=Number(new URLSearchParams(location.search).get('floor'));if(![10,11,12].includes(floor))throw Error('Invalid authored floor');for(let y=0;y<20;y++)board[y]!.fill(y>=floor?'J':null);game={...game,board,active:{kind:'O',rotation:0,origin:{x:4,y:1},penetrator:new URLSearchParams(location.search).get('penetrator')==='1'}};}
export const controller=createController({game,settings,results:[],completedRunId:null},createBrowserPorts(),capabilities);
export const dispose=mount(document.querySelector<HTMLElement>('#app')!,controller,'wide');
