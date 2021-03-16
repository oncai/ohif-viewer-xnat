const activeTool = (state = '', action) => {
  if (action.activeTool) {
    switch (action.type) {
      case 'SET_ACTIVE_TOOL': {
        state = action.activeTool;
      }
    }
  }

  return state;
};

export default activeTool;
