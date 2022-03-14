import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import { PEPPERMINT_TOOL_NAMES } from '../../../peppermint-tools';
import LazyAIMReader from './LazyAIMReader';
import LazyRTStructReader from './LazyRTStructReader';
import getSopInstanceUidToImageIdMap from '../helpers/getSopInstanceUidToImageIdMap';
import addPolygonToToolStateManager from '../helpers/addPolygonToToolStateManager';

const globalToolStateManager =
  cornerstoneTools.globalImageIdSpecificToolStateManager;
const modules = cornerstoneTools.store.modules;

const { FREEHAND_ROI_3D_TOOL } = PEPPERMINT_TOOL_NAMES;

const { getToolForElement, setToolPassive } = cornerstoneTools;

/**
 * @class LazyRoiImporter - Imports contour-based ROI formats to
 *            peppermintTools ROIContours in a lazy-loading mode.
 */
export default class LazyRoiImporter {
  constructor(seriesInstanceUid, updateProgressCallback) {
    this._useLazyLoading = true;
    this._seriesInstanceUid = seriesInstanceUid;

    this.updateProgressCallback = updateProgressCallback;
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
  async importAIMfile(aimDoc, roiCollectionName, roiCollectionLabel) {
    const aimReader = new LazyAIMReader();
    await aimReader.init(
      aimDoc,
      this._seriesInstanceUid,
      roiCollectionName,
      roiCollectionLabel,
      this.updateProgressCallback,
      LazyRoiImporter.addPolygonsToToolStateManager
    );
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
  async importRTStruct(
    rtStructArrayBuffer,
    roiCollectionName,
    roiCollectionLabel
  ) {
    const rtStructReader = new LazyRTStructReader();
    await rtStructReader.init(
      rtStructArrayBuffer,
      this._seriesInstanceUid,
      roiCollectionName,
      roiCollectionLabel,
      this.updateProgressCallback,
      LazyRoiImporter.addPolygonsToToolStateManager
    );
  }

  /**
   * _addPolygonsToToolStateManager - Adds polygons to the cornerstoneTools
   *                                  toolState.
   *
   * @param  {Polygon[]} polygons   The polygons to add to cornerstoneTools.
   * @param  {string} importType The source file type (used for scaling).
   * @param {object} freehand3DStore
   * @returns {null}
   */
  static addPolygonsToToolStateManager(polygons, importType, freehand3DStore) {
    const toolStateManager = globalToolStateManager.saveToolState();

    const sopInstanceUidToImageIdMap = getSopInstanceUidToImageIdMap();

    for (let i = 0; i < polygons.length; i++) {
      const polygon = polygons[i];
      const sopInstanceUid = polygon.sopInstanceUid;
      const correspondingImageId = sopInstanceUidToImageIdMap[sopInstanceUid];

      if (correspondingImageId) {
        addPolygonToToolStateManager(
          polygon,
          toolStateManager,
          correspondingImageId,
          importType,
          freehand3DStore
        );
      }
    }

    // this._refreshToolStateManager(toolStateManager);
    LazyRoiImporter.refreshToolStateManager(toolStateManager);
  }

  /**
   * _refreshToolStateManager - restores the toolStateManager.
   *
   * @param  {object} toolStateManager The toolStateManager
   */
  static refreshToolStateManager(toolStateManager) {
    globalToolStateManager.restoreToolState(toolStateManager);

    cornerstone.getEnabledElements().forEach(enabledElement => {
      const { element } = enabledElement;
      const tool = getToolForElement(element, FREEHAND_ROI_3D_TOOL);

      if (tool.mode !== 'active' && tool.mode !== 'passive') {
        // If not already active or passive, set passive so contours render.
        setToolPassive(FREEHAND_ROI_3D_TOOL);
      }

      cornerstone.updateImage(element);
    });
  }
}
