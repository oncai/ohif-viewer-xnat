import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData';
import contourRenderingApi from './contourRenderingApi';
import CONTOUR_ROI_EVENTS from './ContourRoiEvents';

const onProgressUpdate = (uid, progress) => {
  const roi = contourRenderingApi.getRoi(uid);
  roi.meshProps.reconstructPercent = progress;
  document.dispatchEvent(
    new CustomEvent(CONTOUR_ROI_EVENTS.MESH_PROGRESS, {
      detail: { uid, progress },
    })
  );
};

const onSuccess = (uid, result) => {
  const roi = contourRenderingApi.getRoi(uid);
  const meshProps = roi.meshProps;
  meshProps.reconstruct = false;
  meshProps.isReconstructed = true;
  meshProps.errorMessage = '';
  const polyData = vtkPolyData.newInstance();
  polyData.getPoints().setData(result.points, 3);
  polyData.getPolys().setData(result.polys);
  meshProps.polyData = polyData;

  document.dispatchEvent(
    new CustomEvent(CONTOUR_ROI_EVENTS.MESH_READY, {
      detail: { uid: roi.uid },
    })
  );
};

const onError = (uid, errorMessage) => {
  const roi = contourRenderingApi.getRoi(uid);
  const meshProps = roi.meshProps;
  meshProps.errorMessage = errorMessage;

  document.dispatchEvent(
    new CustomEvent(CONTOUR_ROI_EVENTS.MESH_ERROR, {
      detail: { uid: roi.uid, errorMessage },
    })
  );
};

const onContourRoiCreated = (uid, contourActor) => {
  const roi = contourRenderingApi.getRoi(uid);
  const lineThickness = contourRenderingApi.getLineThickness();
  // Update properties based on the global state
  contourActor.setVisibility(roi.meshProps.visible);
  const property = contourActor.getProperty();
  property.setLineWidth(lineThickness);
};

const meshBuilderCallbacks = {
  onProgressUpdate,
  onSuccess,
  onError,
  onContourRoiCreated,
};

export default meshBuilderCallbacks;
