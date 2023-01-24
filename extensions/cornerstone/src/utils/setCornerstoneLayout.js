import { redux } from '@ohif/core';

const { setLayout } = redux.actions;

/**
 * Update the current layout with a simple Cornerstone one
 *
 * @return void
 */
const setCornerstoneLayout = () => {
  // Restore default tool
  // ToDo: Do we need to restore the previously active tool?
  window.store.dispatch({
    type: 'SET_ACTIVE_TOOL',
    activeTool: 'Wwwc',
  });

  // Reset MPR data if present
  if (window.vtkApis) {
    window.vtkApis.forEach(
      api => api.orientationWidget && api.orientationWidget.setEnabled(false)
    );
    delete window.vtkApis;
  }
  if (window.meshBuilderWorkerPool) {
    window.meshBuilderWorkerPool.cancelAllJobs();
  }
  document.querySelector(`.ViewerMain`).style.pointerEvents = '';

  const layout = {
    numRows: 1,
    numColumns: 1,
    viewports: [{ plugin: 'cornerstone' }],
  };

  const action = setLayout(layout);

  window.store.dispatch(action);
};

export default setCornerstoneLayout;
