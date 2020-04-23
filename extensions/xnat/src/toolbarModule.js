import TOOL_NAMES from './peppermint-tools/toolNames';

const TOOLBAR_BUTTON_TYPES = {
  COMMAND: 'command',
  SET_TOOL_ACTIVE: 'setToolActive',
  BUILT_IN: 'builtIn',
};

const definitions = [
  {
    id: 'freehandRoiTools',
    label: 'Contour',
    icon: 'xnat-contour',
    buttons: [
      {
        id: 'FreehandRoi',
        label: 'Draw',
        icon: 'xnat-contour-freehand',
        type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
        commandName: 'setToolActive',
        commandOptions: { toolName: TOOL_NAMES.FREEHAND_ROI_3D_TOOL },
      },
      {
        id: 'FreehandRoiSculptor',
        label: 'Sculpt',
        icon: 'xnat-contour-freehand-sculpt',
        type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
        commandName: 'setToolActive',
        commandOptions: { toolName: TOOL_NAMES.FREEHAND_ROI_3D_SCULPTOR_TOOL },
      },
    ],
  },
  {
    id: 'brushTools',
    label: 'Mask',
    icon: 'xnat-mask',
    buttons: [
      {
        id: 'Brush',
        label: 'Manual',
        icon: 'xnat-mask-manual',
        type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
        commandName: 'setToolActive',
        commandOptions: { toolName: TOOL_NAMES.BRUSH_3D_TOOL },
      },
      {
        id: 'Brush3DHUGatedTool',
        label: 'Smart CT',
        icon: 'xnat-mask-smart-ct',
        type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
        commandName: 'setToolActive',
        commandOptions: { toolName: TOOL_NAMES.BRUSH_3D_HU_GATED_TOOL },
      },
      {
        id: 'Brush3DAutoGatedTool',
        label: 'Auto',
        icon: 'xnat-mask-auto',
        type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
        commandName: 'setToolActive',
        commandOptions: { toolName: TOOL_NAMES.BRUSH_3D_AUTO_GATED_TOOL },
      },
      // {
      //   id: 'CorrectionScissors',
      //   label: 'Correction Scissors',
      //   icon: 'scissors',
      //   type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
      //   commandName: 'setToolActive',
      //   commandOptions: { toolName: 'CorrectionScissors' },
      // },
    ],
  },
];

export default {
  definitions,
  defaultContext: 'ACTIVE_VIEWPORT::CORNERSTONE',
};
