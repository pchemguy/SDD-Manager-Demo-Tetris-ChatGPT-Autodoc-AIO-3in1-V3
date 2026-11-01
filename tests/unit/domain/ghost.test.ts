/** Midline acceptance uses literal board rows and the public landing/projection contract. */
import {expect,test} from 'vitest';
import {cells,createGame,dispatchGame,landing,projectGame} from '../../../src/domain';
import {DEFAULT_SETTINGS} from '../../../src/rules/settings';
import type {Capabilities,Cell,GameState} from '../../../src/models';
const caps:Capabilities=new Set(['modern','penetrator','settings']);
for(const penetrator of [false,true])for(const floor of [10,11,12])test(`dynamic ghost at floor ${floor}, penetrator ${penetrator}`,()=>{
 const board=Array.from({length:20},(_,y)=>Array<Cell>(10).fill(y>=floor?'J':null));
 const state:GameState={...createGame(123,'ghost',DEFAULT_SETTINGS,caps,'running'),board,active:{kind:'O',rotation:0,origin:{x:4,y:1},penetrator}};
 const before=JSON.stringify(state), pose=landing(board,state.active!);expect(Math.max(...cells(pose!).map(c=>c.y))).toBe(floor-1);
 const hidden=projectGame(state,{...DEFAULT_SETTINGS,ghost:'hide'},caps);expect(hidden.ghost).toBeNull();
 const shown=projectGame(state,DEFAULT_SETTINGS,caps);expect(shown.ghost).toEqual(pose);
 const dynamic=projectGame(state,{...DEFAULT_SETTINGS,ghost:'dynamic'},caps);expect(dynamic.ghost).toEqual(floor===10?null:pose);
 expect({...dynamic,ghost:null}).toEqual({...shown,ghost:null});expect(JSON.stringify(state)).toBe(before);
 for(const ghost of ['hide','dynamic','show'] as const){
  const dropped=dispatchGame(state,'hardDrop',{...DEFAULT_SETTINGS,ghost},caps).state;
  expect(dropped.active).toEqual(pose);expect(dropped.score).toBe(2*(floor-3));
 }
});
test('missing active piece and unavailable modern capability have no ghost in any mode',()=>{
 const state=createGame(123,'ghost',DEFAULT_SETTINGS,caps,'idle');
 for(const ghost of ['hide','dynamic','show'] as const){expect(projectGame(state,{...DEFAULT_SETTINGS,ghost},caps).ghost).toBeNull();expect(projectGame({...state,active:{kind:'O',rotation:0,origin:{x:4,y:0},penetrator:false}},{...DEFAULT_SETTINGS,ghost},new Set()).ghost).toBeNull();}
});
