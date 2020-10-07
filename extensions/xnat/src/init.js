import cornerstoneTools from 'cornerstone-tools';

import freehand3DModule from './peppermint-tools/modules/freehand3DModule.js';
import extendSegmentationModule from './peppermint-tools/modules/extendSegmentationModule';
import { handleContourContextMenu } from './components/XNATContextMenu';

import TOOL_NAMES from './peppermint-tools/toolNames';

import {
  FreehandRoi3DTool,
  FreehandRoi3DSculptorTool,
  Brush3DTool,
  Brush3DHUGatedTool,
  Brush3DAutoGatedTool,
} from './peppermint-tools/tools';

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

  extendSegmentationModule(segmentationModule, config);

  register('module', 'freehand3D', freehand3DModule);
  const freehand3DStore = modules.freehand3D;

  freehand3DStore.state.interpolate = config.interpolate;
  freehand3DStore.state.displayStats = config.showFreehandStats;

  const tools = [
    Brush3DTool,
    Brush3DHUGatedTool,
    Brush3DAutoGatedTool,
    FreehandRoi3DTool,
    FreehandRoi3DSculptorTool,
  ];

  tools.forEach(addTool);

  // subscribe to context menu handler
  commandsManager.runCommand('subscribeToContextMenuHandler', {
    tools: [TOOL_NAMES.FREEHAND_ROI_3D_TOOL],
    contextMenuCallback: handleContourContextMenu,
    dialogIds: ['context-menu',],
  }, 'ACTIVE_VIEWPORT::CORNERSTONE');
}
