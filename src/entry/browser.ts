/** Browser composition; domain and UI have no browser persistence dependency. */
import { createGame } from '../domain';
import { createController } from '../application';
import { createBrowserPorts } from '../platform/browser';
import { mountGame } from '../ui';
import type { Capabilities, Settings } from '../models';
const settings:Settings={ghost:'show',hardDrop:true,nextPreview:true,hardDropLock:'general',lockPolicy:'interval',hold:true};
const capabilities:Capabilities=new Set();
const ports=createBrowserPorts();
const controller=createController({game:createGame(ports.newSeed(),ports.newId(),settings,capabilities,'idle'),settings,results:[],completedRunId:null},ports,capabilities);
mountGame(document.querySelector<HTMLElement>('#app')!,controller);
