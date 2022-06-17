import scaleHandles from './scaleHandles';
import { PEPPERMINT_TOOL_NAMES } from '../../../peppermint-tools';

const { FREEHAND_ROI_3D_TOOL } = PEPPERMINT_TOOL_NAMES;

/**
 * _addOnePolygonToToolStateManager - Adds a single polygon to the
 *                                    cornerstoneTools toolState.
 *
 * @param  {Polygon} polygon            The polygon to add.
 * @param  {object} toolStateManager    The toolStateManager object.
 * @param  {string} correspondingImageId The imageId the polygon should be added to.
 * @param  {string} importType           The source file type (used for scaling).
 * @param {object} freehand3DStore
 * @returns {null}
 */
const addPolygonToToolStateManager = (
  polygon,
  toolStateManager,
  correspondingImageId,
  importType,
  freehand3DStore
) => {
  // Point to correct imageId if multiframe Image
  correspondingImageId = _modifyImageIdIfMultiframe(
    correspondingImageId,
    polygon
  );

  _addImageToolStateIfNotPresent(toolStateManager, correspondingImageId);

  const freehandToolData =
    toolStateManager[correspondingImageId][FREEHAND_ROI_3D_TOOL].data;

  if (!_isPolygonPresentInToolData(freehandToolData, polygon.uid)) {
    const data = polygon.getFreehandToolData(importType);

    freehand3DStore.setters.incrementPolygonCount(
      data.seriesInstanceUid,
      data.structureSetUid,
      data.ROIContourUid
    );
    scaleHandles(data, correspondingImageId);

    freehandToolData.push(data);
  }

  // console.log(toolStateManager);
};

/**
 * _modifyImageIdIfMultiframe - Modifies the imageId for multiframe images,
 *                              so that the polygons are indexed correctly.
 *
 * @param  {string} correspondingImageId The imageid
 * @param  {Polygon} polygon The polygon being added.
 * @returns {string} The
 */
const _modifyImageIdIfMultiframe = (correspondingImageId, polygon) => {
  if (!correspondingImageId.includes('frame=')) {
    //single frame, return unchanged Id
    return correspondingImageId;
  }

  const frameArray = correspondingImageId.split('frame=');
  const correctedFrameNumber = Number(polygon.frameNumber) - 1;

  return `${frameArray[0]}frame=${correctedFrameNumber}`;
};

/**
 * _addImageToolStateIfNotPresent - Adds freehand toolState to imageId if its not present.
 *
 * @param  {object} toolStateManager The toolStateManager object.
 * @param  {string} imageId          The imageId of the Cornerstone image.
 * @returns {null}
 */
const _addImageToolStateIfNotPresent = (toolStateManager, imageId) => {
  // Add freehand tools to toolStateManager if no toolState for imageId
  if (!toolStateManager[imageId]) {
    toolStateManager[imageId] = {};
    toolStateManager[imageId][FREEHAND_ROI_3D_TOOL] = {};
    toolStateManager[imageId][FREEHAND_ROI_3D_TOOL].data = [];
  } else if (!toolStateManager[imageId][FREEHAND_ROI_3D_TOOL]) {
    toolStateManager[imageId][FREEHAND_ROI_3D_TOOL] = {};
    toolStateManager[imageId][FREEHAND_ROI_3D_TOOL].data = [];
  }
};

/**
 * _polygonNotAlreadyPresent - Returns true if the polygon is already on
 *                             the image.
 *
 * @param  {object} freehandToolData The freehandToolData for an image.
 * @param  {string} newPolygonUuid   The uuid of the polygon being checked.
 * @returns {boolean} True if the polygon is not already on the image.
 */
const _isPolygonPresentInToolData = (freehandToolData, newPolygonUuid) => {
  // return freehandToolData.includes(
  //   toolData => toolData.uuid === newPolygonUuid
  // );

  for (let i = 0; i < freehandToolData.length; i++) {
    if (freehandToolData[i].uuid === newPolygonUuid) {
      return true;
    }
  }

  return false;
};



export default addPolygonToToolStateManager;
