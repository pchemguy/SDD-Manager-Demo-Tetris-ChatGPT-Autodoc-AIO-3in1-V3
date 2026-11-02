/** Test-only HTTP asset containment; never serve decoded absolute or escaped paths. */
import {resolve,relative,isAbsolute} from 'node:path';
export function resolveTestAsset(root,url){
 const name=decodeURIComponent(new URL(url,'http://local').pathname).slice(1)||'sidebar.html';
 if(name.includes('..')||name.includes('\\')||isAbsolute(name))return null;
 const target=resolve(root,name),within=relative(root,target);
 return within.startsWith('..')||isAbsolute(within)?null:target;
}
