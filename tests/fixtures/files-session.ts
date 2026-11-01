/** Public composition for real worker/controller/mount disposal; never a release entry. */
import {createGame} from '../../src/domain';
import {createController} from '../../src/application';
import {createBrowserPorts} from '../../src/platform/browser';
import {mount} from '../../src/ui';
import {CAPABILITIES} from '../../src/capabilities';
import {DEFAULT_SETTINGS} from '../../src/rules';
export const controller=createController({game:{...createGame(123,'owned-session',DEFAULT_SETTINGS,CAPABILITIES,'running'),score:11},settings:DEFAULT_SETTINGS,results:[{id:'prior',score:3,timestamp:'2026-01-01T00:00:00Z'}],completedRunId:null},createBrowserPorts(),CAPABILITIES);
export const dispose=mount(document.querySelector<HTMLElement>('#app')!,controller,'wide');
