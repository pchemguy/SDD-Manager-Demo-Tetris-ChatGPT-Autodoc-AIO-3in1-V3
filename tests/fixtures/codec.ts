/** Read-only source consumer; no product test hooks or alternate codec implementation. */
export {encodeSnapshot,decodeSnapshot} from '../../src/files';
let clicks=0;document.querySelector('#probe')!.addEventListener('click',()=>{document.querySelector('#status')!.textContent=`Responsive ${++clicks}`;});document.querySelector('#status')!.textContent='Ready';
