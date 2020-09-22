import checkAndSetPermissions from './utils/checkAndSetPermissions';
import sessionMap from './utils/sessionMap.js';
import csTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';
import { commandsManager } from '@ohif/viewer/src/App';
import TOOL_NAMES from './peppermint-tools/toolNames';
import onKeyDownEvent from './utils/onKeyDownEvent';
import KEY_COMMANDS from './utils/keyCommands';

// "actions" doesn't really mean anything
// these are basically ambigous sets of implementation(s)
const actions = {};

const definitions = {
  xnatSetRootUrl: {
    commandFn: ({ url }) => {
      sessionMap.xnatRootUrl = url;
    },
    storeContexts: [],
    options: { url: null },
  },
  xnatSetView: {
    commandFn: ({ view }) => {
      sessionMap.setView(view);

      console.log(sessionMap);
    },
    storeContexts: [],
    options: { view: null },
  },
  xnatSetSession: {
    commandFn: ({ json, sessionVariables }) => {
      sessionMap.setSession(json, sessionVariables);

      console.log(sessionMap);
    },
    storeContexts: [],
    options: { json: null, sessionVariables: null },
  },
  xnatCheckAndSetPermissions: {
    commandFn: checkAndSetPermissions,
    storeContexts: [],
    options: { projectId: null, parentProjectId: null },
  },
  xnatRemoveToolState: {
    commandFn: ({ element, toolType, tool }) => {
      const freehand3DModule = csTools.store.modules.freehand3D;
      const strctureSet = freehand3DModule.getters.structureSet(
        tool.seriesInstanceUid,
        tool.structureSetUid
      );

      if (strctureSet.isLocked) {
        console.log('Cannot be deleted: member of a locked structure set');
        return;
      }

      csTools.removeToolState(element, toolType, tool);
      cornerstone.getEnabledElements().forEach(enabledElement => {
        cornerstone.updateImage(enabledElement.element);
      });
    },
    storeContexts: [],
    options: { element: null, toolType: null, tool: null },
  },
  xnatCancelROIDrawing: {
    commandFn: ({ evt }) => {
      // const syntheticEventData = getKeyPressData(evt);
      onKeyDownEvent(KEY_COMMANDS.FREEHANDROI_CANCEL_DRAWING);
    },
    storeContexts: [],
    options: { evt: null },
  },
  xnatCompleteROIDrawing: {
    commandFn: ({ evt }) => {
      onKeyDownEvent(KEY_COMMANDS.FREEHANDROI_COMPLETE_DRAWING);
    },
    storeContexts: [],
    options: { evt: null },
  },
  xnatIncreaseBrushSize: {
    commandFn: ({ evt }) => {
      onKeyDownEvent(KEY_COMMANDS.BRUSHTOOL_INCREASE_SIZE);
    },
    storeContexts: [],
    options: { evt: null },
  },
  xnatDecreaseBrushSize: {
    commandFn: ({ evt }) => {
      onKeyDownEvent(KEY_COMMANDS.BRUSHTOOL_DECREASE_SIZE);
    },
    storeContexts: [],
    options: { evt: null },
  },
};

export default {
  actions,
  definitions,
  defaultContext: 'VIEWER',
};
