import init from './init.js';
import commandsModule from './commandsModule.js';
import toolbarModule from './toolbarModule.js';
import panelModule from './panelModule.js';

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'xnat',

  /**
   *
   *
   * @param {object} [configuration={}]
   * @param {object|array} [configuration.csToolsConfig] - Passed directly to `initCornerstoneTools`
   */
  preRegistration({ servicesManager, commandsManager, configuration = {} }) {
    init({ servicesManager, commandsManager, configuration });
  },
  getToolbarModule({ servicesManager }) {
    return toolbarModule;
  },
  getCommandsModule({ servicesManager }) {
    return commandsModule;
  },
  getPanelModule({ servicesManager, commandsManager }) {
    return panelModule(servicesManager, commandsManager);
  },
};

export {
  isLoggedIn,
  xnatAuthenticate,
} from './utils/xnatDev';

export { userManagement } from './utils/userManagement.js';

export { XNATICONS } from './elements';

export { ICRHelpContent } from './components/HelpContent/ICRHelpContent';

export { XNATScanBrowser } from './components/XNATScanBrowser/XNATScanBrowser';

export {
  XNATViewportOverlay,
} from './components/XNATViewportOverlay/XNATViewportOverlay';
