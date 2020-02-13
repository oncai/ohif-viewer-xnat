import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import Polygon from '../../../peppermint-tools/utils/classes/Polygon';
import AIMReader from './AIMReader.js';
import RTStructReader from './RTStructReader.js';
import { utils } from '@ohif/core';
import TOOL_NAMES from '../../../peppermint-tools/toolNames';

const { studyMetadataManager } = utils;

const globalToolStateManager =
  cornerstoneTools.globalImageIdSpecificToolStateManager;
const modules = cornerstoneTools.store.modules;

const { FREEHAND_ROI_3D_TOOL } = TOOL_NAMES;

/**
 * @class RoiImporter - Imports contour-based ROI formats to
 * peppermintTools ROIContours.
 */
export default class RoiImporter {
  constructor(seriesInstanceUid) {
    this._seriesInstanceUid = seriesInstanceUid;
    this._sopInstanceUidToImageIdMap = this._getSopInstanceUidToImageIdMap();

    this._freehand3DStore = modules.freehand3D;
  }

  /**
   * importAIMfile -  Imports ImageAnnotations from an AIM
   *                  ImageAnnotationCollection as peppermintTools ROIContours.
   *
   * @param  {HTMLElement} aimDoc        The AIM ImageAnnotationCollection file.
   * @param  {string} roiCollectionName  The name of the ROICollection.
   * @param  {string} roiCollectionLabel The label of the ROICollection.
   * @returns {null}
   */
  importAIMfile(aimDoc, roiCollectionName, roiCollectionLabel) {
    const aimReader = new AIMReader(
      aimDoc,
      this._seriesInstanceUid,
      roiCollectionName,
      roiCollectionLabel
    );
    this._addPolygonsToToolStateManager(aimReader.polygons, 'AIM');
  }

  /**
   * importRTStruct - Imports ROIContours from an RTSTRUCT as
   * peppermintTools ROIContours.
   *
   * @param  {ArrayBuffer} rtStructArrayBuffer The RTSTRUCT file.
   * @param  {string} roiCollectionName  The name of the ROICollection.
   * @param  {string} roiCollectionLabel The label of the ROICollection.
   * @returns {null}
   */
  importRTStruct(rtStructArrayBuffer, roiCollectionName, roiCollectionLabel) {
    const rtStructReader = new RTStructReader(
      rtStructArrayBuffer,
      this._seriesInstanceUid,
      roiCollectionName,
      roiCollectionLabel
    );
    this._addPolygonsToToolStateManager(rtStructReader.polygons, 'RTSTRUCT');
  }

  /**
   * _addPolygonsToToolStateManager - Adds polygons to the cornerstoneTools
   *                                  toolState.
   *
   * @param  {Polygon[]} polygons   The polygons to add to cornerstoneTools.
   * @param  {string} importType The source file type (used for scaling).
   * @returns {null}
   */
  _addPolygonsToToolStateManager(polygons, importType) {
    const toolStateManager = globalToolStateManager.saveToolState();

    for (let i = 0; i < polygons.length; i++) {
      const polygon = polygons[i];
      const sopInstanceUid = polygon.sopInstanceUid;
      const correspondingImageId = this._sopInstanceUidToImageIdMap[
        sopInstanceUid
      ];

      this._addOnePolygonToToolStateManager(
        polygon,
        toolStateManager,
        correspondingImageId,
        importType
      );
    }

    this._refreshToolStateManager(toolStateManager);
  }

  /**
   * _addOnePolygonToToolStateManager - Adds a single polygon to the
   *                                    cornerstoneTools toolState.
   *
   * @param  {Polygon} polygon            The polygon to add.
   * @param  {object} toolStateManager    The toolStateManager object.
   * @param  {string} correspondingImageId The imageId the polygon should be added to.
   * @param  {type} importType           The source file type (used for scaling).
   * @returns {null}
   */
  _addOnePolygonToToolStateManager(
    polygon,
    toolStateManager,
    correspondingImageId,
    importType
  ) {
    if (!correspondingImageId) {
      // ROI for image which is not loaded
      return;
    }

    // Point to correct imageId if multiframe Image
    correspondingImageId = this._modifyImageIdIfMultiframe(
      correspondingImageId,
      polygon
    );

    this._addImageToolStateIfNotPresent(toolStateManager, correspondingImageId);

    const freehandToolData =
      toolStateManager[correspondingImageId][FREEHAND_ROI_3D_TOOL].data;
    if (this._polygonNotAlreadyPresent(freehandToolData, polygon.uid)) {
      const data = polygon.getFreehandToolData(importType);

      this._freehand3DStore.setters.incrementPolygonCount(
        data.seriesInstanceUid,
        data.structureSetUid,
        data.ROIContourUid
      );
      freehandToolData.push(data);
    }
  }

  /**
   * _polygonNotAlreadyPresent - Returns true if the polygon is not already on
   *                             the image.
   *
   * @param  {object} freehandToolData The freehandToolData for an image.
   * @param  {string} newPolygonUuid   The uuid of the polygon being checked.
   * @returns {boolean} True if the polygon is not already on the image.
   */
  _polygonNotAlreadyPresent(freehandToolData, newPolygonUuid) {
    for (let i = 0; i < freehandToolData.length; i++) {
      if (freehandToolData[i].uuid === newPolygonUuid) {
        return false;
      }
    }

    return true;
  }

  /**
   * _addImageToolStateIfNotPresent - Adds freehand toolState to imageId if its not present.
   *
   * @param  {object} toolStateManager The toolStateManager object.
   * @param  {string} imageId          The imageId of the Cornerstone image.
   * @returns {null}
   */
  _addImageToolStateIfNotPresent(toolStateManager, imageId) {
    // Add freehand tools to toolStateManager if no toolState for imageId
    if (!toolStateManager[imageId]) {
      toolStateManager[imageId] = {};
      toolStateManager[imageId][FREEHAND_ROI_3D_TOOL] = {};
      toolStateManager[imageId][FREEHAND_ROI_3D_TOOL].data = [];
    } else if (!toolStateManager[imageId][FREEHAND_ROI_3D_TOOL]) {
      toolStateManager[imageId][FREEHAND_ROI_3D_TOOL] = {};
      toolStateManager[imageId][FREEHAND_ROI_3D_TOOL].data = [];
    }
  }

  /**
   * _refreshToolStateManager - restores the toolStateManager.
   *
   * @param  {object} toolStateManager The toolStateManager
   */
  _refreshToolStateManager(toolStateManager) {
    globalToolStateManager.restoreToolState(toolStateManager);

    cornerstone.getEnabledElements().forEach(enabledElement => {
      cornerstone.updateImage(enabledElement.element);
    });
  }

  /**
   * _getSopInstanceUidToImageIdMap - Generates and returns a map of
   *                                  sop instance UID to imageId.
   *
   * @returns {object}  The sop instance UID to image Id map.
   */
  _getSopInstanceUidToImageIdMap() {
    const sopInstanceUidToImageIdMap = {};
    const studies = studyMetadataManager.all();

    console.log(studies);

    debugger;

    for (let i = 0; i < studies.length; i++) {
      const series = studies[i].getSeriesByUID(this._seriesInstanceUid);
      if (series !== undefined) {
        const instanceCount = series.getInstanceCount();

        for (let j = 0; j < instanceCount; j++) {
          const instance = series.getInstanceByIndex(j);
          const imageId = instance.getImageId();
          const sopInstanceUid = instance.sopInstanceUID;
          sopInstanceUidToImageIdMap[sopInstanceUid] = imageId;
        }
      }
    }

    return sopInstanceUidToImageIdMap;
  }

  /**
   * _modifyImageIdIfMultiframe - Modifies the imageId for multiframe images,
   *                              so that the polygons are indexed correctly.
   *
   * @param  {string} correspondingImageId The imageid
   * @param  {Polygon} polygon The polygon being added.
   * @returns {string} The
   */
  _modifyImageIdIfMultiframe(correspondingImageId, polygon) {
    if (!correspondingImageId.includes('frame=')) {
      //single frame, return unchanged Id
      return correspondingImageId;
    }

    const frameArray = correspondingImageId.split('frame=');
    const correctedFrameNumber = Number(polygon.frameNumber) - 1;

    return `${frameArray[0]}frame=${correctedFrameNumber}`;
  }
}
