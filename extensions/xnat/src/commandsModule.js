import checkAndSetPermissions from './utils/checkAndSetPermissions';
import sessionMap from './utils/sessionMap.js';

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
};

export default {
  actions,
  definitions,
  defaultContext: 'VIEWER',
};
