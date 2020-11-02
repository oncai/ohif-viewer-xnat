import cornerstoneTools from 'cornerstone-tools';

import {
  PEPPERMINT_TOOL_NAMES,
  freehand3DModule,
  extendSegmentationModule,
  FreehandRoi3DTool,
  FreehandRoi3DSculptorTool,
  Brush3DTool,
  Brush3DHUGatedTool,
  Brush3DAutoGatedTool,
} from './peppermint-tools';
import { handleContourContextMenu } from './components/XNATContextMenu';

import {
  AIAAProbeTool,
  AIAAModule,
} from './aiaa-tools';

const { store, register, addTool, CorrectionScissorsTool } = cornerstoneTools;

const defaultConfig = {
  maxRadius: 64,
  holeFill: 2,
  holeFillRange: [0, 20],
  strayRemove: 5,
  strayRemoveRange: [0, 99],
  interpolate: true,
  showFreehandStats: false,
  gates: [
    {
      // https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4309522/
      name: 'adipose',
      range: [-190, -30],
    },
    {
      // https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4309522/
      name: 'muscle',
      range: [-29, 150],
    },
    {
      name: "bone",
      range: [150, 2000]
    },
    {
      name: 'custom',
      range: [0, 100],
    },
  ],
};

const { modules } = store;

/**
 *
 * @param {object} configuration
 * @param {Object|Array} configuration.csToolsConfig
 */
export default function init({ servicesManager, commandsManager, configuration = {} }) {
  const config = Object.assign({}, defaultConfig, configuration);
  const segmentationModule = cornerstoneTools.getModule('segmentation');

  // add custom setters & getters to the CSTools segmentation module
  extendSegmentationModule(segmentationModule, config);

  // register the freehand3D module
  register('module', 'freehand3D', freehand3DModule);
  const freehand3DStore = modules.freehand3D;

  freehand3DStore.state.interpolate = config.interpolate;
  freehand3DStore.state.displayStats = config.showFreehandStats;

  // register the AIAA module
  register('module', 'aiaa', AIAAModule);

  const tools = [
    Brush3DTool,
    Brush3DHUGatedTool,
    Brush3DAutoGatedTool,
    FreehandRoi3DTool,
    FreehandRoi3DSculptorTool,
    /* AIAA Tools */
    // DeepgrowProbeTool,
    // DExtr3DProbeTool,
    AIAAProbeTool,
  ];

  tools.forEach(addTool);

  // subscribe to context menu handler
  commandsManager.runCommand('subscribeToContextMenuHandler', {
    tools: [PEPPERMINT_TOOL_NAMES.FREEHAND_ROI_3D_TOOL],
    contextMenuCallback: handleContourContextMenu,
    dialogIds: ['context-menu',],
  }, 'ACTIVE_VIEWPORT::CORNERSTONE');
}
