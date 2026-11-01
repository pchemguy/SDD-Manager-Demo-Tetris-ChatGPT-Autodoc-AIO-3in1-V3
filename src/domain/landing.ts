/** Shared landing and traversal: ordinary first collision or penetrator deepest legal hole. */
import type { Board, Piece } from '../models';
import { canPlace, cells } from './geometry';
const withinBounds=(piece:Piece)=>cells(piece).every(({x,y})=>Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&x<10&&y<20);
/** A penetrator may cross occupied cells, but its final pose must be fully legal at/below origin. */
export function landing(board:Board,piece:Piece):Piece|null {
  if(piece.penetrator){
    if(!withinBounds(piece))return null;
    let result:Piece|null=null;
    for(let y=piece.origin.y;y<20;y++){
      const candidate={...piece,origin:{...piece.origin,y}};
      if(canPlace(board,candidate,false))result=candidate;
    }
    return result;
  }
  if(!canPlace(board,piece,true))return null;
  let result=piece;
  for(;;){const candidate={...result,origin:{...result.origin,y:result.origin.y+1}};if(!canPlace(board,candidate,true))break;result=candidate;}
  return canPlace(board,result,false)?result:null;
}
/** Intermediate overlap is allowed only for a bounded penetrator with a reachable final pose. */
export const canTraverse=(board:Board,piece:Piece):boolean=>piece.penetrator?withinBounds(piece)&&landing(board,piece)!==null:canPlace(board,piece,true);
