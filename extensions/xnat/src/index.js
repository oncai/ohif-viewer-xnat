import init from './init.js';
import commandsModule from './commandsModule.js';
import toolbarModule from './toolbarModule.js';
import panelModule from './panelModule.js';
import { version } from '../package.json';

import { MEASUREMENT_TOOL_NAMES } from './XNATMeasurement';
import { PEPPERMINT_TOOL_NAMES as ROI_TOOL_NAMES } from './peppermint-tools';

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'xnat',
  version: version.toUpperCase(),

  /**
   *
   *
   * @param {object} [configuration={}]
   * @param {object|array} [configuration.csToolsConfig] - Passed directly to `initCornerstoneTools`
   */
  preRegistration({ servicesManager, commandsManager, configuration = {} }) {
    init({ servicesManager, commandsManager, configuration });
  },
  getToolbarModule({ commandsManager, servicesManager }) {
    return toolbarModule({ commandsManager, servicesManager });
  },
  getCommandsModule({ servicesManager }) {
    return commandsModule;
  },
  getPanelModule({ commandsManager, api, servicesManager }) {
    return panelModule(commandsManager, api, servicesManager);
  },
};

export { isLoggedIn, xnatAuthenticate } from './utils/xnatDev';

export { userManagement } from './utils/userManagement.js';

export { XNATICONS, sliderUtils, ReactSlider } from './elements';

export { ICRHelpContent } from './components/HelpContent/ICRHelpContent';

export {
  XNATStudyBrowser,
} from './components/XNATStudyBrowser/XNATStudyBrowser';

export {
  XNATViewportOverlay,
} from './components/XNATViewportOverlay/XNATViewportOverlay';

export { XNATToolStrategiesDialog } from './components/XNATToolStrategies';

export { ICRAboutContent } from './components/AboutContent/ICRAboutContent';

export {
  stackSynchronizer,
  updateImageSynchronizer,
} from './utils/synchronizers';

export { referenceLines } from './utils/CSReferenceLines/referenceLines';

export { DATA_IMPORT_STATUS, ROI_COLOR_TEMPLATES, colorTools } from './utils';

const XNAT_TOOL_NAMES = {
  ROI_TOOL_NAMES: [...Object.values(ROI_TOOL_NAMES)],
  MEASUREMENT_TOOL_NAMES: [...Object.values(MEASUREMENT_TOOL_NAMES)],
};

XNAT_TOOL_NAMES.ALL_ANNOTAION_TOOL_NAMES = [
  ...XNAT_TOOL_NAMES.ROI_TOOL_NAMES,
  ...XNAT_TOOL_NAMES.MEASUREMENT_TOOL_NAMES,
];

export { XNAT_TOOL_NAMES };
