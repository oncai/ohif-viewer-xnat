// "actions" doesn't really mean anything
// these are basically ambigous sets of implementation(s)
const actions = {
  xnatCheckAndSetPermssions: () => {
    console.log('~~ GOOFY');
  },
};

const definitions = {
  xnatCheckAndSetPermssions: {
    commandFn: actions.xnatCheckAndSetPermssions,
    storeContexts: [],
  },
};

export default {
  actions,
  definitions,
  defaultContext: 'VIEWER',
};
