import cornerstoneTools from 'cornerstone-tools';
import initNIFTILoader from './initNIFTILoader';
import { initXNATRoi } from './peppermint-tools';
import { AIAAProbeTool, AIAAModule } from './aiaa-tools';
import { MONAIProbeTool, MONAIModule } from './MONAILabelClient';

import { initXNATMeasurement } from './XNATMeasurement';

const { store, register, addTool } = cornerstoneTools;
const { modules } = store;

/**
 *
 * @param {object} configuration
 * @param {Object|Array} configuration.csToolsConfig
 */
export default function init({
  servicesManager,
  commandsManager,
  configuration = {},
}) {
  // Initiate cornerstoneNIFTIImageLoader
  initNIFTILoader();

  // register the AIAA module
  register('module', 'aiaa', AIAAModule);

  register('module', 'monai', MONAIModule);

  const tools = [
    /* AIAA Tools */
    AIAAProbeTool,
    /* MONAI Tools */
    MONAIProbeTool,
  ];
  tools.forEach(addTool);

  initXNATRoi({
    servicesManager,
    commandsManager,
    configuration,
  });

  initXNATMeasurement({
    servicesManager,
    commandsManager,
    configuration,
  });
}
