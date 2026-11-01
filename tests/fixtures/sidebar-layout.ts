/** Public sidebar-mode consumer before native extension adapters; never a release entry. */
import {createGame} from '../../src/domain';
import {createController} from '../../src/application';
import {createBrowserPorts} from '../../src/platform/browser';
import {mount} from '../../src/ui';
import {CAPABILITIES} from '../../src/capabilities';
import {DEFAULT_SETTINGS} from '../../src/rules';
const ports=createBrowserPorts();
const controller=createController({game:createGame(123,'sidebar-layout',DEFAULT_SETTINGS,CAPABILITIES,'idle'),settings:DEFAULT_SETTINGS,results:[],completedRunId:null},ports,CAPABILITIES);
mount(document.querySelector<HTMLElement>('#app')!,controller,'sidebar');
