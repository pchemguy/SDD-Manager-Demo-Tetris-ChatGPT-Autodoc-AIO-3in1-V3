/** Readonly piece previews share geometry and palette with the board renderer. */
import type { PieceKind } from '../models';
import { cells } from '../domain';
import { PIECE_COLORS } from './board';
export function renderPreview(target:HTMLElement,kind:PieceKind|null,label:string):void {
  if(target.dataset.kind===(kind??''))return;
  target.dataset.kind=kind??'';target.setAttribute('role','img');target.setAttribute('aria-label',`${label}: ${kind??'empty'}`);
  const occupied=new Set(kind?cells({kind,rotation:0,origin:{x:0,y:0},penetrator:false}).map(({x,y})=>`${x},${y}`):[]);
  const children=Array.from({length:16},(_,index)=>{const cell=document.createElement('span');cell.setAttribute('aria-hidden','true');if(kind&&occupied.has(`${index%4},${Math.floor(index/4)}`))cell.style.backgroundColor=PIECE_COLORS[kind];return cell;});
  target.replaceChildren(...children);
}
