/** Firefox-specific event-page entry; listeners register synchronously. */
import {registerFirefox,type FirefoxAPI} from '../../src/platform/extension/firefox';
declare const browser:FirefoxAPI;
registerFirefox(browser);
