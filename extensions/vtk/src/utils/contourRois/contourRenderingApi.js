import csTools from 'cornerstone-tools';
import { colorTools, DATA_IMPORT_STATUS } from '@xnat-ohif/extension-xnat';
import meshBuilderWorkerPool from './workers/MeshBuilderWorkerPool';
import getRoiDataArray from './getRoiDataArray';
import CONTOUR_ROI_EVENTS from './ContourRoiEvents';

const modules = csTools.store.modules;
const globalToolStateManager = csTools.globalImageIdSpecificToolStateManager;
const FREEHAND_ROI_3D_TOOL = 'FreehandRoi3DTool';

const collectionsMap = new Map();
const roisMap = new Map();

const state = {
  lineThickness: 1,
};

class ContourRenderingApi {
  init(SeriesInstanceUID, apis) {
    // Clear collection and ROI map data
    collectionsMap.clear();
    roisMap.clear();

    this._freehand3DModule = modules.freehand3D;
    this._series = this._freehand3DModule.getters.series(SeriesInstanceUID);
    this._toolStateManager = globalToolStateManager.saveToolState();

    this._vtkApis = apis;

    if (!this._series || !this._series.structureSetCollection) {
      return;
    }

    this._getCSRoiCollection();
    this._reconstructRois();
  }

  _getCSRoiCollection() {
    this._series.structureSetCollection.forEach(structureSet => {
      const validRois = structureSet.ROIContourCollection.filter(
        roi =>
          roi.importStatus === DATA_IMPORT_STATUS.IMPORTED && roi.polygonCount
        // && roi.visible
      );

      validRois.forEach(roi => {
        const roiUID = roi.uid;
        const meshProps = roi.meshProps;

        const color = colorTools.hexToRgb(roi.color);
        if (color) {
          Object.values(color).map((c, i) => (meshProps.color[i] = c / 255));
        }

        const contours = meshProps.contours;
        const newContours = this._getCSContours(roiUID);
        if (this._shouldUpdateMesh(contours, newContours)) {
          meshProps.isReconstructed = false;
          meshProps.reconstructPercent = 0;
          meshProps.contours = newContours;
          if (meshProps.polyData) {
            delete meshProps.polyData;
          }
        }

        roisMap.set(roiUID, roi);
      });

      if (validRois.length > 0) {
        collectionsMap.set(structureSet.uid, {
          ...structureSet,
          meshProps: { validRois, visible: true },
        });
      }
    });

    document.dispatchEvent(
      new CustomEvent(CONTOUR_ROI_EVENTS.ROI_LIST_UPDATED, {})
    );
  }

  _getCSContours(roiUID) {
    const toolStateManager = this._toolStateManager;
    const contours = {};

    Object.keys(toolStateManager).forEach(imageId => {
      if (
        toolStateManager[imageId] &&
        toolStateManager[imageId][FREEHAND_ROI_3D_TOOL]
      ) {
        const toolState = toolStateManager[imageId][FREEHAND_ROI_3D_TOOL];
        const toolData = toolState.data;

        const filteredToolData = toolData.filter(
          data => data.ROIContourUid === roiUID
        );

        filteredToolData.forEach(data => {
          let points = [];
          if (data.handles && data.handles.points) {
            points = data.handles.points;
          }
          if (points.length > 0) {
            contours[data.uid] = {
              imageId,
              points,
              timestamp: data.timestamp,
            };
          }
        });
      }
    });

    return contours;
  }

  _shouldUpdateMesh(contours, newContours) {
    const newContourUids = Object.keys(newContours);
    const contourUids = Object.keys(contours);

    const sharedContourUids = newContourUids.filter(uid =>
      contourUids.includes(uid)
    );

    if (contourUids.length !== newContourUids.length) {
      return true;
    } else if (sharedContourUids.length !== newContourUids.length) {
      // Different UIDs when contours removed or added
      return true;
    } else {
      return contourUids.some(
        uid => contours[uid].timestamp !== newContours[uid].timestamp
      );
    }
  }

  _reconstructRois() {
    roisMap.forEach(roi => {
      const meshProps = roi.meshProps;
      if (meshProps.isReconstructed) {
        // Emit mesh ready event for roi with previously constructed mesh
        document.dispatchEvent(
          new CustomEvent(CONTOUR_ROI_EVENTS.MESH_READY, {
            detail: { uid: roi.uid },
          })
        );
      } else {
        // Calculate world-space point data and submit for mesh reconstruction
        const pointData = getRoiDataArray(meshProps);
        if (pointData) {
          meshBuilderWorkerPool.queueJob({
            params: { uid: roi.uid, pointData },
          });
        } else {
          // Error in mapping the points to world-space
          meshProps.errorMessage =
            'Error in mapping points from image to world-space.';
          if (meshProps.polyData) {
            delete meshProps.polyData;
          }
          document.dispatchEvent(
            new CustomEvent(CONTOUR_ROI_EVENTS.MESH_ERROR, {
              detail: { uid: roi.uid },
            })
          );
        }
      }
    });
  }

  getCollectionUids() {
    return Array.from(collectionsMap.keys());
  }

  getCollection(uid) {
    return collectionsMap.get(uid);
  }

  getRoi(uid) {
    return roisMap.get(uid);
  }

  // Methods related to VTK Contour ROI

  onContourRoiCreated(roiUid, contourActor) {
    const roi = this.getRoi(roiUid);
    // Update properties based on the global state
    contourActor.setVisibility(roi.meshProps.visible);
    const property = contourActor.getProperty();
    property.setLineWidth(state.lineThickness);
  }

  updateLineThickness(thickness) {
    state.lineThickness = thickness;

    this._vtkApis.forEach(api => {
      const contours = api.contoursApi.contours;
      Object.keys(contours).forEach(uid => {
        const contourActor = api.contoursApi.contours[uid].actor;
        contourActor.getProperty().setLineWidth(state.lineThickness);
      });
      api.updateImage();
    });
  }

  getLineThickness() {
    return state.lineThickness;
  }

  ToggleRoiVisibility(uid) {
    const roi = this.getRoi(uid);
    const isVisible = !roi.meshProps.visible;
    roi.meshProps.visible = isVisible;

    this._vtkApis.forEach(api => {
      const contourActor = api.contoursApi.contours[uid].actor;
      contourActor.setVisibility(isVisible);

      api.updateImage();
    });
  }
}

const contourRenderingApi = new ContourRenderingApi();

export default contourRenderingApi;
