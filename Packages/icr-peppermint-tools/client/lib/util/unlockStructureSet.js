import { cornerstoneTools } from "meteor/ohif:cornerstone";
import { OHIF } from "meteor/ohif:core";
import getSeriesInstanceUidFromImageId from "./getSeriesInstanceUidFromImageId.js";

const modules = cornerstoneTools.store.modules;
const globalToolStateManager =
  cornerstoneTools.globalImageIdSpecificToolStateManager;

/**
 * Unlock a structureSet, moving them to the working directory
 * so that they may be edited
 *
 * @param {string} seriesInstanceUid  The UID of the series on which the ROIs
 *                                    reside.
 * @param {string} structureSetUid    The uid of the newly created structureSet.
 * @returns {null}
 */
export default function(seriesInstanceUid, structureSetUid) {
  const freehand3DStore = modules.freehand3D;
  const structureSet = freehand3DStore.getters.structureSet(
    seriesInstanceUid,
    structureSetUid
  );

  const ROIContourCollection = structureSet.ROIContourCollection;

  const workingStructureSet = freehand3DStore.getters.structureSet(
    seriesInstanceUid
  );

  // Create new ROIContours in the working directory.
  for (let i = 0; i < ROIContourCollection.length; i++) {
    const ROIContour = ROIContourCollection[i];

    freehand3DStore.setters.ROIContour(
      seriesInstanceUid,
      "DEFAULT",
      ROIContour.name,
      {
        uid: ROIContour.uid,
        polygonCount: ROIContour.polygonCount,
        color: ROIContour.color
      }
    );
  }

  const toolStateManager = globalToolStateManager.saveToolState();

  Object.keys(toolStateManager).forEach(elementId => {
    // Filter for imageIds in this series that contain freehand toolData.
    if (
      getSeriesInstanceUidFromImageId(elementId) === seriesInstanceUid &&
      toolStateManager[elementId] &&
      toolStateManager[elementId].freehandMouse
    ) {
      const toolState = toolStateManager[elementId].freehandMouse;
      const toolData = toolState.data;

      movePolygonsInStructureSetToDefault(
        structureSet.uid,
        toolData,
        seriesInstanceUid
      );
    }
  });

  // Remove named structureSet.
  freehand3DStore.setters.deleteStructureSet(
    seriesInstanceUid,
    structureSetUid
  );

  if (workingStructureSet.activeROIContourIndex === null) {
    workingStructureSet.activeROIContourIndex = 0;
  }
}

/**
 * movePolygonsInStructureSetToDefault - Move the polygons from the structureSetUid to the
 *                          default structureSet.
 *
 * @param  {string} structureSetUid   The structure set to move.
 * @param  {Object} toolData          freehand tool data for a specific imageId.
 * @param  {string} seriesInstanceUid The seriesInstanceUid of the stack.
 * @returns {null}
 */
function movePolygonsInStructureSetToDefault(
  structureSetUid,
  toolData,
  seriesInstanceUid
) {
  const freehand3DStore = modules.freehand3D;

  const defaultStructureSet = freehand3DStore.getters.structureSet(
    seriesInstanceUid,
    "DEFAULT"
  );

  for (let i = 0; i < toolData.length; i++) {
    const data = toolData[i];

    if (data.structureSetUid === structureSetUid) {
      movePolygonToDefaultStructureSet(
        data,
        seriesInstanceUid,
        defaultStructureSet
      );
    }
  }
}

/**
 * movePolygonToDefaultStructureSet - Move a single polygon to refernce the
 *                                    new ROI on the default structureSet.
 *
 * @param  {Object} toolDataI           The toolData for the polygon.
 * @param  {string} seriesInstanceUid   The series instance UID of the stack.
 * @param  {Object} defaultStructureSet The default structure set.
 * @returns {null}
 */
function movePolygonToDefaultStructureSet(
  toolDataI,
  seriesInstanceUid,
  defaultStructureSet
) {
  const freehand3DStore = modules.freehand3D;
  const referencedROIContour = freehand3DStore.getters.ROIContour(
    seriesInstanceUid,
    "DEFAULT",
    toolDataI.ROIContourUid
  );

  toolDataI.structureSetUid = "DEFAULT";
  toolDataI.referencedROIContour = referencedROIContour;
  toolDataI.referencedStructureSet = defaultStructureSet;
}
