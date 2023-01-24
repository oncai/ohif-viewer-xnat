import csTools from 'cornerstone-tools';
import { colorTools, DATA_IMPORT_STATUS } from '@xnat-ohif/extension-xnat';

const modules = csTools.store.modules;
const globalToolStateManager = csTools.globalImageIdSpecificToolStateManager;

const FREEHAND_ROI_3D_TOOL = 'FreehandRoi3DTool';

const getCSRoiCollectionList = (displaySetInstanceUID, SeriesInstanceUID) => {
  const roiCollections = {};

  const freehand3DModule = modules.freehand3D;
  const series = freehand3DModule.getters.series(SeriesInstanceUID);

  if (series && series.structureSetCollection) {
    series.structureSetCollection.forEach(structureSet => {
      const collectionUid = structureSet.uid;
      const isLocked = collectionUid !== 'DEFAULT';
      const name = structureSet.name;
      const parsedRois = {};
      structureSet.ROIContourCollection.forEach(roi => {
        if (roi.importStatus === DATA_IMPORT_STATUS.IMPORTED && roi.visible) {
          const roiUID = roi.uid;
          let color = colorTools.hexToRgb(roi.color);
          color = color ? Object.values(color).map(c => c / 255) : [1, 1, 1];
          const contours = getContours(roiUID);
          if (Object.keys(contours).length > 0) {
            parsedRois[roiUID] = {
              uid: roiUID,
              collectionUid,
              displaySetInstanceUID,
              name: roi.name,
              color: [...color, 1], //add opacity value
              polygonCount: roi.polygonCount,
              contours,
            };
          }
        }
      });
      roiCollections[collectionUid] = {
        name,
        isLocked,
        rois: parsedRois,
      };
    });
  }

  return roiCollections;
};

const getContours = roiUID => {
  const toolStateManager = globalToolStateManager.saveToolState();
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
};

export default getCSRoiCollectionList;
