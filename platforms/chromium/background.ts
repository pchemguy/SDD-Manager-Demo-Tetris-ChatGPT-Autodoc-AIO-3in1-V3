/** Chromium-only background composition; shared broker contains no gameplay clock. */
import {registerChromium,type ChromiumAPI} from '../../src/platform/extension/chromium';
declare const chrome:ChromiumAPI;
registerChromium(chrome);
