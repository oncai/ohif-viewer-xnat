import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';

import xnatRoiApi from './XNATRoiApi';
import PEPPERMINT_TOOL_NAMES from './toolNames.js';
import { freehand3DModule, extendSegmentationModule } from './modules';
import {
  FreehandRoi3DTool,
  FreehandRoi3DSculptorTool,
  Brush3DTool,
  Brush3DHUGatedTool,
  Brush3DAutoGatedTool,
  XNATSphericalBrushTool,
  XNATFreehandScissorsTool,
  XNATCircleScissorsTool,
  XNATRectangleScissorsTool,
  XNATCorrectionScissorsTool,
} from './tools';
import { handleContourContextMenu } from '../components/ContourContextMenu';

const { store, register, addTool, EVENTS: CS_EVENTS } = cornerstoneTools;
const { modules } = store;

const getDefaultConfiguration = () => {
  const gateSettings = JSON.parse(
    localStorage.getItem('xnat-gate-settings') || '{}'
  );
  if (gateSettings.customGate === undefined) {
    gateSettings.customGate = {};
  }

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
        name: 'bone',
        range: [150, 2000],
      },
      {
        name: 'custom',
        range: gateSettings.customGate.range || [0, 100],
      },
    ],
    activeGate: gateSettings.activeGate,
    customGateSeparation: gateSettings.customGate.separation || 10,
  };

  return defaultConfig;
};

const ROI_ACTION_MAP = {
  contourAdded: event => {
    xnatRoiApi.onContourRoiAdded(event);
  },
  contourRemoved: event => {
    xnatRoiApi.onContourRoiRemoved(event);
  },
  contourCompleted: event => {
    xnatRoiApi.onContourRoiCompleted(event);
  },
  contourInterpolated: event => {
    xnatRoiApi.onContourRoiInterpolated(event);
  },
};

const registerEventHandlers = () => {
  const onRoiEvent = (action, event) => {
    return ROI_ACTION_MAP[action](event);
  };
  const onContourRoiAdded = onRoiEvent.bind(this, 'contourAdded');
  const onContourRoiRemoved = onRoiEvent.bind(this, 'contourRemoved');
  const onContourRoiCompleted = onRoiEvent.bind(this, 'contourCompleted');
  const onContourRoiInterpolated = onRoiEvent.bind(this, 'contourInterpolated');

  const elementEnabledHandler = evt => {
    const element = evt.detail.element;
    element.addEventListener(CS_EVENTS.MEASUREMENT_ADDED, onContourRoiAdded);
    element.addEventListener(
      CS_EVENTS.MEASUREMENT_REMOVED,
      onContourRoiRemoved
    );
    element.addEventListener(
      CS_EVENTS.MEASUREMENT_COMPLETED,
      onContourRoiCompleted
    );
    element.addEventListener(
      'peppermintinterpolateevent',
      onContourRoiInterpolated
    );
  };

  const elementDisabledHandler = evt => {
    const element = evt.detail.element;
    element.removeEventListener(CS_EVENTS.MEASUREMENT_ADDED, onContourRoiAdded);
    element.removeEventListener(
      CS_EVENTS.MEASUREMENT_REMOVED,
      onContourRoiRemoved
    );
    element.removeEventListener(
      CS_EVENTS.MEASUREMENT_COMPLETED,
      onContourRoiCompleted
    );
    element.removeEventListener(
      'peppermintinterpolateevent',
      onContourRoiInterpolated
    );
  };

  cornerstone.events.addEventListener(
    cornerstone.EVENTS.ELEMENT_ENABLED,
    elementEnabledHandler
  );
  cornerstone.events.addEventListener(
    cornerstone.EVENTS.ELEMENT_DISABLED,
    elementDisabledHandler
  );
};

/**
 * @export
 * @param {Object} servicesManager
 * @param commandsManager
 * @param {Object} configuration
 */
export default function init({
  servicesManager,
  commandsManager,
  configuration,
}) {
  // Initiate tools
  const config = Object.assign({}, getDefaultConfiguration(), configuration);
  const segmentationModule = cornerstoneTools.getModule('segmentation');

  // add custom setters & getters to the CSTools segmentation module
  extendSegmentationModule(segmentationModule, config);

  // register the freehand3D module
  register('module', 'freehand3D', freehand3DModule);
  const freehand3DStore = modules.freehand3D;

  freehand3DStore.state.interpolate = config.interpolate;
  freehand3DStore.state.displayStats = config.showFreehandStats;

  // Add Brush Eraser tool
  addTool(Brush3DTool, {
    name: 'BrushEraser',
    configuration: {
      alwaysEraseOnClick: true,
    },
  });

  const tools = [
    Brush3DTool,
    Brush3DHUGatedTool,
    Brush3DAutoGatedTool,
    FreehandRoi3DTool,
    FreehandRoi3DSculptorTool,
    /* Additional maks tools */
    XNATSphericalBrushTool,
    XNATFreehandScissorsTool,
    XNATCircleScissorsTool,
    XNATRectangleScissorsTool,
    XNATCorrectionScissorsTool,
  ];
  tools.forEach(addTool);

  // Events routed to the XNAT ROI API
  registerEventHandlers();

  // subscribe to context menu handler
  commandsManager.runCommand(
    'subscribeToContextMenuHandler',
    {
      tools: [PEPPERMINT_TOOL_NAMES.FREEHAND_ROI_3D_TOOL],
      contextMenuCallback: handleContourContextMenu,
      dialogIds: ['context-menu'],
    },
    'ACTIVE_VIEWPORT::CORNERSTONE'
  );
}
