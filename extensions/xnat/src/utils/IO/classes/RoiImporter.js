import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import { PEPPERMINT_TOOL_NAMES } from '../../../peppermint-tools';
import AIMReader from './AIMReader.js';
import RTStructReader from './RTStructReader.js';
import allowStateUpdate from '../../awaitStateUpdate';
import getSopInstanceUidToImageIdMap from '../helpers/getSopInstanceUidToImageIdMap';
import addPolygonToToolStateManager from '../helpers/addPolygonToToolStateManager';

const globalToolStateManager =
  cornerstoneTools.globalImageIdSpecificToolStateManager;
const modules = cornerstoneTools.store.modules;

const { FREEHAND_ROI_3D_TOOL } = PEPPERMINT_TOOL_NAMES;

const { getToolForElement, setToolPassive } = cornerstoneTools;

/**
 * @class RoiImporter - Imports contour-based ROI formats to
 * peppermintTools ROIContours.
 */
export default class RoiImporter {
  constructor(seriesInstanceUid, updateProgressCallback) {
    this._seriesInstanceUid = seriesInstanceUid;

    this._freehand3DStore = modules.freehand3D;
    this.updateProgressCallback = updateProgressCallback;
    this._percentComplete = 0;
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
    const aimReader = new AIMReader();
    await aimReader.init(
      aimDoc,
      this._seriesInstanceUid,
      roiCollectionName,
      roiCollectionLabel,
      this.updateProgressCallback
    );

    await this._addPolygonsToToolStateManager(aimReader.polygons, 'AIM');
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
    const rtStructReader = new RTStructReader();
    await rtStructReader.init(
      rtStructArrayBuffer,
      this._seriesInstanceUid,
      roiCollectionName,
      roiCollectionLabel,
      this.updateProgressCallback
    );
    await this._addPolygonsToToolStateManager(
      rtStructReader.polygons,
      'RTSTRUCT'
    );
  }

  /**
   * _addPolygonsToToolStateManager - Adds polygons to the cornerstoneTools
   *                                  toolState.
   *
   * @param  {Polygon[]} polygons   The polygons to add to cornerstoneTools.
   * @param  {string} importType The source file type (used for scaling).
   * @returns {null}
   */
  async _addPolygonsToToolStateManager(polygons, importType) {
    const toolStateManager = globalToolStateManager.saveToolState();

    const numpPolygons = polygons.length;
    this._percentComplete = 0;

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
          this._freehand3DStore
        );
      }

      const percentComplete = Math.floor(((i + 1) * 100) / numpPolygons);
      if (percentComplete !== this._percentComplete) {
        this.updateProgressCallback(`Updating Tool State: ${percentComplete}%`);
        this._percentComplete = percentComplete;
        await allowStateUpdate();
      }
    }

    this._refreshToolStateManager(toolStateManager);
  }

  /**
   * _refreshToolStateManager - restores the toolStateManager.
   *
   * @param  {object} toolStateManager The toolStateManager
   */
  _refreshToolStateManager(toolStateManager) {
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
