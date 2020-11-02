const activeTool = (state = '', action) => {
  switch (action.type) {
    case 'SET_ACTIVE_TOOL': {
      state = action.activeTool;
    }
  }

  return state;
};

export default activeTool;