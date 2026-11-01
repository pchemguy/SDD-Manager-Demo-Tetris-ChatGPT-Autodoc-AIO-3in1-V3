/** Electron main entry. The shared renderer receives only ordinary browser APIs. */
import {app,protocol,session,BrowserWindow,Menu,dialog} from 'electron';
import {join} from 'node:path';
import {launchDesktop} from './shell';
app.setName('Tetris');
void launchDesktop({app,protocol,session,BrowserWindow,Menu,dialog},join(app.getAppPath(),'renderer'));
