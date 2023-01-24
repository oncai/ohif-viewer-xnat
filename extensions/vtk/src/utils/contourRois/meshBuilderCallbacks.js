import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData';
import OHIF from '@ohif/core';
import { DATA_IMPORT_STATUS } from '@xnat-ohif/extension-xnat';
import contourRenderingApi from './contourRenderingApi';

const { setViewportSpecificData } = OHIF.redux.actions;

const onProgressUpdate = (uid, progress) => {
  document.dispatchEvent(
    new CustomEvent('roimeshbuilder:progress', {
      detail: { uid, progress },
    })
  );
};

const onSuccess = (uid, result) => {
  const roi = contourRenderingApi.getRoiByUid(uid);
  roi.reconstruct = false;
  roi.isReconstructed = DATA_IMPORT_STATUS.IMPORTED;
  const polyData = vtkPolyData.newInstance();
  polyData.getPoints().setData(result.points, 3);
  polyData.getPolys().setData(result.polys);
  roi.polyData = polyData;

  setTimeout(() => {
    const viewports = window.store.getState().viewports;
    const viewportSpecificData = viewports.viewportSpecificData[0];
    let vtkContourRoisData = viewportSpecificData.vtkContourRoisData || {};

    vtkContourRoisData = {
      ...vtkContourRoisData,
      [roi.uid]: {
        polyData: roi.polyData,
        color: roi.color,
      },
    };

    for (let i = 0; i < 3; i++) {
      window.store.dispatch(
        setViewportSpecificData(i, {
          vtkContourRoisData,
        })
      );
    }
  }, 3000);
};

const onError = (uid, error) => {
  console.error(error);
};

const meshBuilderCallbacks = {
  onProgressUpdate,
  onSuccess,
  onError,
};

export default meshBuilderCallbacks;
