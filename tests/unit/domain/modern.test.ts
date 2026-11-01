/** Public-engine fixtures check modern rules without relying on private sequence helpers. */
import { expect, test } from 'vitest';
import { advanceGame, createGame, projectGame } from '../../../src/domain';
import type { Capabilities, Cell, GameState, Settings } from '../../../src/models';
const settings:Settings={ghost:'show',hardDrop:true,nextPreview:true,hardDropLock:'general',lockPolicy:'interval',hold:true};
const caps:Capabilities=new Set(['modern']);
const empty=()=>Array.from({length:20},()=>Array<Cell>(10).fill(null));
function nextSpawn(state:GameState):GameState {
  return advanceGame({...state,board:empty(),active:{kind:'O',rotation:0,origin:{x:4,y:18},penetrator:false},timers:{gravityRemainingMs:1000,lockRemainingMs:1,grounded:true}},1,settings,caps).state;
}
test('modern factory selects seven-bag; every complete bag contains exactly seven kinds',()=>{
  for(const seed of [1,123,4294967295]){
    let game=createGame(seed,'bag',settings,caps,'running');expect(game.sequence.mode).toBe('bag7');
    for(let bag=0;bag<4;bag++){
      const drawn=[];for(let n=0;n<7;n++){drawn.push(game.active!.kind);game=nextSpawn(game);}
      expect(drawn.sort()).toEqual(['I','J','L','O','S','T','Z']);
    }
  }
});
test('preview is non-consuming and identifies the subsequent spawn across bag boundaries',()=>{
  let game=createGame(123,'bag',settings,caps,'running');
  for(let n=0;n<16;n++){
    const before=JSON.stringify(game);const first=projectGame(game,settings,caps);expect(first.next).not.toBeNull();
    expect(projectGame(game,settings,caps)).toEqual(first);expect(JSON.stringify(game)).toBe(before);
    const next=nextSpawn(game);expect(next.active!.kind).toBe(first.next);game=next;
  }
});
test('modern sequences are deterministic, serializable and capability-scoped',()=>{
  const a=createGame(987,'bag',settings,caps,'running');expect(a).toEqual(createGame(987,'bag',settings,caps,'running'));
  expect(nextSpawn(JSON.parse(JSON.stringify(a)))).toEqual(nextSpawn(a));
  expect(createGame(987,'classic',settings,new Set(),'running').sequence.mode).toBe('uniform');
  expect(projectGame(a,{...settings,nextPreview:false},caps).next).toBeNull();
  expect(projectGame(a,settings,new Set()).next).toBeNull();
});
