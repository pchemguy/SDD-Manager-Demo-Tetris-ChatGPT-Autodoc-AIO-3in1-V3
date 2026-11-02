/** The secure standard app origin supplies ordinary browser APIs; no IPC or Node bridge. */
import { createGame } from '../domain';
import { createController } from '../application';
import { createBrowserPorts } from '../platform/browser';
import { mount } from '../ui';
import { CAPABILITIES } from '../capabilities';
import { DEFAULT_SETTINGS } from '../rules';
const ports=createBrowserPorts();
const controller=createController({game:createGame(ports.newSeed(),ports.newId(),DEFAULT_SETTINGS,CAPABILITIES,'idle'),settings:DEFAULT_SETTINGS,results:[],completedRunId:null},ports,CAPABILITIES);
mount(document.querySelector<HTMLElement>('#app')!,controller,'wide');
