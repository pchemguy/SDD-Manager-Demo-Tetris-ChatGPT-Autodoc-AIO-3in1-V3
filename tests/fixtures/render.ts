/** Test-only public controller/mount consumer; never included in release build inputs. */
import { createGame } from '../../src/domain';
import { createController } from '../../src/application';
import { createBrowserPorts } from '../../src/platform/browser';
import { mount } from '../../src/ui';
import type { Capabilities,Cell,PieceKind,Settings } from '../../src/models';
const settings:Settings={ghost:'show',hardDrop:true,nextPreview:true,hardDropLock:'general',lockPolicy:'interval',hold:true};
const capabilities:Capabilities=new Set(['modern','penetrator']);
const board=Array.from({length:20},()=>Array<Cell>(10).fill(null));
for(const [x,kind]of (['I','J','L','O','S','T','Z'] as PieceKind[]).entries())board[19]![x]=kind;
board[19]![9]='penetrator';board[5]![4]='J';
const game={...createGame(123,'render-fixture',settings,capabilities,'running'),board,bonuses:1,active:{kind:'O' as const,rotation:0 as const,origin:{x:4,y:5},penetrator:true}};
export const controller=createController({game,settings,results:[],completedRunId:null},createBrowserPorts(),capabilities);
export const dispose=mount(document.querySelector<HTMLElement>('#app')!,controller,'wide');
