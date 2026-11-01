/** Literal hole/blocker fixtures protect penetrator reachability independently of ordinary falling. */
import { expect,test } from 'vitest';
import { canPlace, canTraverse, cells, landing } from '../../../src/domain';
import type { Cell,Piece,PieceKind } from '../../../src/models';
const empty=()=>Array.from({length:20},()=>Array<Cell>(10).fill(null));
const piece:Piece={kind:'O',rotation:0,origin:{x:4,y:5},penetrator:true};
test('penetrator skips blockers and chooses the deepest non-overlapping hole even above an invalid floor',()=>{
  const board=empty();board[8]![4]='J';board[8]![5]='J';board[19]![4]='J';
  expect(landing(board,{...piece,penetrator:false})?.origin).toEqual({x:4,y:6});
  expect(landing(board,piece)?.origin).toEqual({x:4,y:17});
  board[18]![4]='J';expect(landing(board,piece)?.origin).toEqual({x:4,y:16});
});
test('traversal may overlap settled cells only when a valid final landing remains below',()=>{
  const board=empty();board[5]![4]='J';const before=JSON.stringify(board);
  expect(canPlace(board,piece,true)).toBe(false);expect(canTraverse(board,piece)).toBe(true);expect(canTraverse(board,{...piece,penetrator:false})).toBe(false);
  expect(landing(board,piece)?.origin).toEqual({x:4,y:18});expect(JSON.stringify(board)).toBe(before);
  for(let y=5;y<20;y++)board[y]![4]='J';expect(canTraverse(board,piece)).toBe(false);expect(landing(board,piece)).toBeNull();
});
test('invalid side/bottom bounds and missing full placements cannot be repaired by an upward search',()=>{
  const board=empty();expect(landing(board,{...piece,origin:{x:-1,y:5}})).toBeNull();expect(landing(board,{...piece,origin:{x:4,y:19}})).toBeNull();
  for(let y=0;y<20;y++)board[y]![4]='J';expect(landing(board,{...piece,origin:{x:4,y:-2}})).toBeNull();
  expect(canTraverse(board,{...piece,origin:{x:4,y:-2}})).toBe(false);
});
test('all shape rotations choose a wholly legal geometric floor on an empty board',()=>{
  for(const kind of ['I','J','L','O','S','T','Z'] as PieceKind[])for(const rotation of [0,1,2,3] as const){
    const p:Piece={kind,rotation,origin:{x:3,y:-2},penetrator:true};const maxLocalY=Math.max(...cells({...p,origin:{x:0,y:0}}).map(c=>c.y));
    const result=landing(empty(),p);expect(result?.origin.y).toBe(19-maxLocalY);expect(canPlace(empty(),result!,false)).toBe(true);
  }
});
