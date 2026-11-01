/** Own keyboard repeat clocks and release held state when gameplay loses focus or pauses. */
import type { GameAction } from '../models';
const actions:Record<string,GameAction>={ArrowLeft:'left',ArrowRight:'right',ArrowDown:'softDrop',ArrowUp:'rotateCW',x:'rotateCW',z:'rotateCCW'};
export function bindInput(target:HTMLElement, action:(action:GameAction)=>void, togglePause:()=>void) {
  const host=target.ownerDocument.defaultView!;
  const held=new Map<string,number|undefined>();
  const clear=()=>{for(const timer of held.values())if(timer!==undefined)host.clearTimeout(timer);held.clear();};
  const keyOf=(event:KeyboardEvent)=>event.key.length===1?event.key.toLowerCase():event.key;
  const keydown=(event:KeyboardEvent)=>{
    const key=keyOf(event);if(key!=='Escape'&&!actions[key])return;
    event.preventDefault();if(event.repeat||held.has(key))return;
    held.set(key,undefined);
    if(key==='Escape'){togglePause();return;}
    action(actions[key]!);
    if(!held.has(key))return;
    const interval=key==='ArrowDown'?40:50;
    if(key==='ArrowLeft'||key==='ArrowRight'||key==='ArrowDown'){
      const repeat=()=>{if(!held.has(key))return;action(actions[key]!);if(held.has(key))held.set(key,host.setTimeout(repeat,interval));};
      held.set(key,host.setTimeout(repeat,key==='ArrowDown'?40:150));
    }
  };
  const keyup=(event:KeyboardEvent)=>{const key=keyOf(event);if(held.has(key)){const timer=held.get(key);if(timer!==undefined)host.clearTimeout(timer);held.delete(key);}};
  const visibility=()=>{if(target.ownerDocument.hidden)clear();};
  target.addEventListener('keydown',keydown);target.ownerDocument.addEventListener('keyup',keyup);
  target.addEventListener('blur',clear);host.addEventListener('blur',clear);target.ownerDocument.addEventListener('visibilitychange',visibility);
  return {clear,dispose:()=>{clear();target.removeEventListener('keydown',keydown);target.ownerDocument.removeEventListener('keyup',keyup);target.removeEventListener('blur',clear);host.removeEventListener('blur',clear);target.ownerDocument.removeEventListener('visibilitychange',visibility);}};
}
