import checkAndSetPermissions from './utils/checkAndSetPermissions';
import sessionMap from './utils/sessionMap.js';
import csTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';

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
};

export default {
  actions,
  definitions,
  defaultContext: 'VIEWER',
};
