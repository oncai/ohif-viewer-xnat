import cornerstoneTools from 'cornerstone-tools';

const { store, register, addTool, CorrectionScissorsTool } = cornerstoneTools;

import freehand3DModule from './peppermint-tools/modules/freehand3DModule.js';
import extendSegmentationModule from './peppermint-tools/modules/extendSegmentationModule';

import {
  FreehandRoi3DTool,
  FreehandRoi3DSculptorTool,
  Brush3DTool,
  Brush3DHUGatedTool,
  Brush3DAutoGatedTool,
} from './peppermint-tools/tools';

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
export default function init({ servicesManager, configuration = {} }) {
  const config = Object.assign({}, defaultConfig, configuration);
  const segmentationModule = cornerstoneTools.getModule('segmentation');

  extendSegmentationModule(segmentationModule, config);

  register('module', 'freehand3D', freehand3DModule);
  const freehand3DStore = modules.freehand3D;

  freehand3DStore.state.interpolate = config.interpolate;
  freehand3DStore.state.displayStats = config.showFreehandStats;

  //const tools = [BrushTool, CorrectionScissorsTool, Brush3DTool, Brush3DHUGatedTool];
  const tools = [
    Brush3DTool,
    Brush3DHUGatedTool,
    Brush3DAutoGatedTool,
    CorrectionScissorsTool,
    FreehandRoi3DTool,
    FreehandRoi3DSculptorTool,
  ];

  tools.forEach(addTool);

  // addTool(Brush3DTool, { name: config.brush3dToolName });
  // addTool(Brush3DHUGatedTool, { name: config.brush3DHUGatedToolName });
  // addTool(Brush3DAutoGatedTool, { name: config.brush3DAutoGatedTool });
  // addTool(FreehandRoi3DTool, { name: config.freehandRoi3DTool });
  // addTool(FreehandRoi3DSculptorTool, {
  //   name: config.freehandRoi3DSculptorTool,
  //   referencedToolName: config.freehandRoi3DTool,
  // });
}
