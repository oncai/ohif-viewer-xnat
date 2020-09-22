import { commandsManager } from '@ohif/viewer/src/App';
import csTools from 'cornerstone-tools';
import TOOL_NAMES from '../peppermint-tools/toolNames';
import KEY_COMMANDS from './keyCommands';


export default function onKeyDownEvent(keyCommand) {
  if (keyCommand === KEY_COMMANDS.FREEHANDROI_CANCEL_DRAWING
    || keyCommand === KEY_COMMANDS.FREEHANDROI_COMPLETE_DRAWING) {
    const element = commandsManager.runCommand('getActiveViewportEnabledElement');
    const tool = csTools.getToolForElement(element, TOOL_NAMES.FREEHAND_ROI_3D_TOOL);
    if (tool.mode === 'active') {
      if (keyCommand === KEY_COMMANDS.FREEHANDROI_CANCEL_DRAWING) {
        tool.cancelDrawing(element);
      } else if (keyCommand === KEY_COMMANDS.FREEHANDROI_COMPLETE_DRAWING) {
        tool.completeDrawing(element);
      }
    }
  } else if (keyCommand === KEY_COMMANDS.BRUSHTOOL_INCREASE_SIZE
    || keyCommand === KEY_COMMANDS.BRUSHTOOL_DECREASE_SIZE) {
    const module = csTools.getModule('segmentation');
    const { configuration } = csTools.getModule('segmentation');
    let radius = configuration.radius;
    if (keyCommand === KEY_COMMANDS.BRUSHTOOL_INCREASE_SIZE) {
      radius += 2;
    } else if (keyCommand === KEY_COMMANDS.BRUSHTOOL_DECREASE_SIZE) {
      radius -= 2;
    }
    module.setters.radius(radius);
    console.log(radius);
  }
};
