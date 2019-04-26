import { OHIF } from "meteor/ohif:core";
import { cornerstoneTools } from "meteor/ohif:cornerstone";
import { Polygon } from "meteor/icr:peppermint-tools";

const globalToolStateManager =
  cornerstoneTools.globalImageIdSpecificToolStateManager;

const modules = cornerstoneTools.store.modules;

/**
 * @class RoiExtractor - Extracts polygons from cornerstoneTools for exporting
 *                       to XNAT.
 */
export class RoiExtractor {
  constructor(seriesInstanceUid) {
    this._seriesInstanceUid = seriesInstanceUid;
    this._ROIContours = [];
    this._freehand3DStore = modules.freehand3D;
  }

  /**
   * hasROIContoursToExtract - checks if any contours exist on the series.
   *
   * @returns {type}  True if the series has contours.
   */
  hasROIContoursToExtract() {
    const workingStructureSet = this._freehand3DStore.getters.structureSet(
      this._seriesInstanceUid
    );

    if (!workingStructureSet) {
      return false;
    }

    const ROIContourCollection = workingStructureSet.ROIContourCollection;

    let hasContours = false;

    for (let i = 0; i < ROIContourCollection.length; i++) {
      if (ROIContourCollection[i] && ROIContourCollection[i].polygonCount > 0) {
        this._ROIContours[i] = [];
        hasContours = true;
      }
    }

    return hasContours;
  }

  /**
   * extractROIContours - extracts the contours given by the exportMask.
   *
   * @param  {boolean[]} exportMask  A true/false array dictating which ROIContours
   *                            to extract.
   * @returns {object[]}  An array of extraced ROIContours.
   */
  extractROIContours(exportMask) {
    const toolStateManager = globalToolStateManager.saveToolState();

    Object.keys(toolStateManager).forEach(imageId => {
      // Only get polygons from this series
      if (
        this._getSeriesInstanceUidFromImageId(imageId) ===
        this._seriesInstanceUid
      ) {
        // grab the freehand tool for this DICOM instance
        const freehandToolState = toolStateManager[imageId].freehandMouse;

        if (freehandToolState) {
          // Append new ROIs to polygon list
          this._getNewPolygonsInInstance(
            freehandToolState.data,
            imageId,
            exportMask
          );
        }
      }
    });

    return this._ROIContours;
  }

  /**
   * _getNewPolygonsInInstance - extracts all the new polygons in the instance.
   *
   * @param  {object} toolData   The toolData for this instance.
   * @param  {string} imageId    The imageId of the instance.
   * @param  {boolean[]} exportMask  A true/false array dictating which ROIContours
   *                            to extract.
   * @returns {null}
   */
  _getNewPolygonsInInstance(toolData, imageId, exportMask) {
    for (let i = 0; i < toolData.length; i++) {
      const data = toolData[i];

      const ROIContourIndex = this._freehand3DStore.getters.ROIContourIndex(
        data.seriesInstanceUid,
        data.structureSetUid,
        data.ROIContourUid
      );
      const referencedStructureSet = data.referencedStructureSet;

      // Check to see if the ROIContour referencing this polygon is eligble for export.
      if (
        referencedStructureSet.uid === "DEFAULT" &&
        exportMask[ROIContourIndex]
      ) {
        this._appendPolygon(data, imageId, ROIContourIndex);
      }
    }
  }

  /**
   * _appendPolygon - Adds the polygon to the list of polygons on the ROIContour.
   *
   * @param  {object} data          The toolData of the polygon.
   * @param  {string} imageId       The imageId of the instance.
   * @param  {number} ROIContourIndex The index of the ROIContour.
   * @returns {null}
   */
  _appendPolygon(data, imageId, ROIContourIndex) {
    const ROIContourName = data.referencedROIContour.name;
    const sopInstanceUid = this._getSOPInstanceUidFromImageId(imageId);
    const frameNumber = this._getFrameNumber(imageId);

    const polygon = new Polygon(
      data.handles.points,
      sopInstanceUid,
      this._seriesInstanceUid,
      "DEFAULT",
      data.ROIContourUid,
      data.uid,
      frameNumber
    );

    this._ROIContours[ROIContourIndex].push(polygon);
  }

  /**
   * _getSOPInstanceUidFromImageId -  Gets the sop instance UID of an image
   *                                  from the imageId.
   *
   * @param  {string} imageId The imageId of the instance.
   * @returns {string} The sop instance UID.
   */
  _getSOPInstanceUidFromImageId(imageId) {
    const metaData = OHIF.viewer.metadataProvider.getMetadata(imageId);
    return metaData.instance.sopInstanceUid;
  }

  /**
   * _getSeriesInstanceUidFromImageId - Gets the series instance UID of an
   *                                    image from its imageId.
   *
   * @param  {string} imageId The imageId of the instance.
   * @returns {string} The series instance UID.
   */
  _getSeriesInstanceUidFromImageId(imageId) {
    const metaData = OHIF.viewer.metadataProvider.getMetadata(imageId);
    return metaData.series.seriesInstanceUid;
  }

  /**
   * _getFrameNumber - Gets the frame number of an image from its imageId.
   *
   * @param  {string} imageId The imageId of the instance.
   * @returns {string} The frame number.
   */
  _getFrameNumber(imageId) {
    if (imageId.includes("frame=")) {
      const frameArray = imageId.split("frame=");
      return String(Number(frameArray[1]) + 1);
    }

    return "1";
  }
}
