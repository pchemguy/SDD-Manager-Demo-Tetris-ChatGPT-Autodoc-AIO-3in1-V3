/** Authored public-boundary consumer for tied/top-ten completed histories; not a release entry. */
import {createGame} from '../../src/domain';
import {createController} from '../../src/application';
import {createBrowserPorts} from '../../src/platform/browser';
import {DEFAULT_SETTINGS,rankResults} from '../../src/rules';
import {mount} from '../../src/ui';
import type {Capabilities,Cell} from '../../src/models';
const capabilities:Capabilities=new Set(['modern','settings','leaderboard']);
const board=Array.from({length:20},()=>Array<Cell>(10).fill(null));board[1]!.fill('J');
const game={...createGame(123,'middle-run',DEFAULT_SETTINGS,capabilities,'running'),board,score:500,active:{kind:'O' as const,rotation:0 as const,origin:{x:4,y:-1},penetrator:false},timers:{gravityRemainingMs:1000,lockRemainingMs:100,grounded:true}};
const results=rankResults([{id:'high',score:900,timestamp:'2026-11-01T00:00:00Z'},{id:'early',score:500,timestamp:'2026-10-31T00:00:00Z'},{id:'A',score:500,timestamp:'2026-11-01T00:00:00.1Z'},{id:'z',score:500,timestamp:'2026-11-01T00:00:00.100Z'},...Array.from({length:6},(_,i)=>({id:`low-${i}`,score:i,timestamp:'2026-01-01T00:00:00Z'}))]);
export const controller=createController({game,settings:DEFAULT_SETTINGS,results,completedRunId:null},{...createBrowserPorts(),utcNow:()=> '2026-11-01T00:00:00.100Z'},capabilities);
export const dispose=mount(document.querySelector<HTMLElement>('#app')!,controller,'wide');
