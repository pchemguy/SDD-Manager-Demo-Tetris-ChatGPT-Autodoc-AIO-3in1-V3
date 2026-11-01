/** Browser composition; domain and UI have no browser persistence dependency. */
import { createGame } from '../domain';
import { createController } from '../application';
import { createBrowserPorts } from '../platform/browser';
import { mount } from '../ui';
import { CAPABILITIES } from '../capabilities';
import { DEFAULT_SETTINGS } from '../rules';
const settings=DEFAULT_SETTINGS;
const capabilities=CAPABILITIES;
const ports=createBrowserPorts();
const controller=createController({game:createGame(ports.newSeed(),ports.newId(),settings,capabilities,'idle'),settings,results:[],completedRunId:null},ports,capabilities);
mount(document.querySelector<HTMLElement>('#app')!,controller,'wide');
