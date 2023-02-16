import cornerstoneTools from 'cornerstone-tools';
import dicomParser from 'dicom-parser';
import { Polygon } from '../../../peppermint-tools';
import allowStateUpdate from '../../awaitStateUpdate';
import DATA_IMPORT_STATUS from '../../dataImportStatus';
// eslint-disable-next-line import/no-webpack-loader-syntax
import RTSPolygonsExtractWorker from '../workers/RTSPolygonsExtractor.worker';
import WebWorkerPromise from 'webworker-promise';
import generateUID from '../../../peppermint-tools/utils/generateUID';
import colorTools from '../../colorTools';

const modules = cornerstoneTools.store.modules;
const triggerEvent = cornerstoneTools.importInternal('util/triggerEvent');

/**
 * @class RTStructReader - Reads an RTSTRUCT using dicomParser and adds
 *                         callbacks to extract any ROIContours on-demand.
 */
export default class LazyRTStructReader {
  async init(
    rtStructArrayBuffer,
    seriesInstanceUidToImport,
    roiCollectionName,
    roiCollectionLabel,
    updateProgressCallback,
    addPolygonsToToolStateManager
  ) {
    this._dataSet = this._getdataSet(rtStructArrayBuffer);
    this._isRTStruct();

    this._updateProgressCallback = updateProgressCallback;

    this._seriesInstanceUidToImport = seriesInstanceUidToImport;
    this._roiCollectionName = roiCollectionName;
    this._roiCollectionLabel = roiCollectionLabel;
    this._sopInstanceUid = this._dataSet.string(RTStructTag['SOPInstanceUID']);
    this._structureSetName = this._dataSet.string(
      RTStructTag['StructureSetName']
    );
    this._structureSetLabel = this._dataSet.string(
      RTStructTag['StructureSetLabel']
    );
    this._roiNames = {};

    this._sopInstancesInSeries = this._getSopInstancesInSeries();

    this._freehand3DStore = modules.freehand3D;

    this._fireContourExtractedEvent = (roiUid, percent) =>
      triggerEvent(document, 'xnatcontourextracted', {
        structUid: this._roiCollectionLabel,
        roiUid,
        percent,
      });
    this._fireContourRoiExtractedEvent = roiUid =>
      triggerEvent(document, 'xnatcontourroiextracted', {
        structUid: this._roiCollectionLabel,
        roiUid,
      });
    this._addPolygonsToToolStateCallback = addPolygonsToToolStateManager;

    if (this._sopInstancesInSeries.length > 0) {
      this._extractROINames();
      await this._extractROIContours();
    }
  }

  /**
   * _getdataSet - Gets the dataSet from the RTSTRUCT file.
   *
   * @param  {ArrayBuffer} rtStructArrayBuffer The RTSTRUCT file.
   * @returns {object}  The dataset.
   */
  _getdataSet(rtStructArrayBuffer) {
    let byteArray = new Uint8Array(rtStructArrayBuffer);

    let dataSet = null;
    try {
      dataSet = dicomParser.parseDicom(byteArray);
    } catch (err) {
      console.error(err.message);
      throw new Error(err);
    }

    return dataSet;
  }

  /**
   * _isRTStruct - checks if the DICOM is an RTSTRUCT
   *
   * @returns {boolean} True if the DICOM is an RTSTRUCT.
   */
  _isRTStruct() {
    const SOPClassUID = this._dataSet.string(RTStructTag['SOPClassUID']);
    if (SOPClassUID !== RadiationTherapyStructureSetStorage) {
      throw `DICOM file is not an RT-Struct. It has SOPClassUID: ${SOPClassUID}`;
    }

    return;
  }

  /**
   * _getSopInstancesInSeries - gets the referenced sop instance UIDs in the series.
   *
   * @returns {string[]} An array of sop instance UIDs.
   */
  _getSopInstancesInSeries() {
    let sopInstanceUids = [];
    const RTReferencedSeries = this._getRTReferenceSeries();

    if (RTReferencedSeries !== null) {
      const ContourImageSequenceItems =
        RTReferencedSeries.dataSet.elements[RTStructTag['ContourImageSequence']]
          .items;

      for (let i = 0; i < ContourImageSequenceItems.length; i++) {
        const ContourImage = ContourImageSequenceItems[i];
        const sopInstanceUid = ContourImage.dataSet.string(
          RTStructTag['ReferencedSOPInstanceUID']
        );
        sopInstanceUids.push(sopInstanceUid);
      }
    }

    return sopInstanceUids;
  }

  /**
   * _getRTReferenceSeries -  gets the RTReferencedSeries that corresponds to
   *                          the active series.
   *
   * @returns {object||null}  The referenced series node of the DICOM dataset.
   */
  _getRTReferenceSeries() {
    const ReferencedFrameofReferenceSequenceItems = this._dataSet.elements[
      RTStructTag['ReferencedFrameofReferenceSequence']
    ].items;

    for (let i = 0; i < ReferencedFrameofReferenceSequenceItems.length; i++) {
      const ReferencedFrameofReference =
        ReferencedFrameofReferenceSequenceItems[i];
      const RTReferencedStudySequenceItems =
        ReferencedFrameofReference.dataSet.elements[
          RTStructTag['RTReferencedStudySequence']
        ].items;

      for (let j = 0; j < RTReferencedStudySequenceItems.length; j++) {
        const RTReferencedStudy = RTReferencedStudySequenceItems[j];
        const RTReferencedSeriesSequenceItems =
          RTReferencedStudy.dataSet.elements[
            RTStructTag['RTReferencedSeriesSequence']
          ].items;

        for (let k = 0; k < RTReferencedSeriesSequenceItems.length; k++) {
          const RTReferencedSeries = RTReferencedSeriesSequenceItems[k];
          const seriesInstanceUid = RTReferencedSeries.dataSet.string(
            RTStructTag['SeriesInstanceUID']
          );
          if (seriesInstanceUid === this._seriesInstanceUidToImport) {
            return RTReferencedSeries;
          }
        }
      }
    }

    return null;
  }

  /**
   * _extractROINames - extracts the ROI names.
   *
   * @returns {null}
   */
  _extractROINames() {
    const StructureSetROISequence = this._dataSet.elements[
      RTStructTag['StructureSetROISequence']
    ];
    const ROIs = StructureSetROISequence.items;
    for (let i = 0; i < ROIs.length; i++) {
      const ROINumber = ROIs[i].dataSet.string(RTStructTag.ROINumber);
      const ROIName = ROIs[i].dataSet.string(RTStructTag.ROIName);
      this._roiNames[ROINumber] = ROIName;
    }
  }

  /**
   * _extractROIContours - extracts the contours from the RTSTRUCT.
   *
   * @returns {null}
   */
  async _extractROIContours() {
    const ROIContourSequence = this._dataSet.elements[
      RTStructTag['ROIContourSequence']
    ];
    const ROIContours = ROIContourSequence.items;

    let percentComplete = 0;
    this._updateProgressCallback(`Parsing RTStruct Data: ${percentComplete}%`);
    await allowStateUpdate();

    for (let i = 0; i < ROIContours.length; i++) {
      const ROIContourDataSet = ROIContours[i].dataSet;
      const ROINumber = ROIContourDataSet.string(
        RTStructTag['ReferencedROINumber']
      );

      const ROIDisplayColor = ROIContourDataSet.string(
        RTStructTag['ROIDisplayColor']
      );
      // Set default ROI color to black
      const ROIColor = ROIDisplayColor
        ? colorTools.rgbToHex(ROIDisplayColor, '\\')
        : '#00000';

      const contourSequence =
        ROIContourDataSet.elements[RTStructTag['ContourSequence']];
      const polygonItems = contourSequence.items;

      const loadFunc = async ROIContourUid => {
        const roiContour = this._freehand3DStore.getters.ROIContour(
          this._seriesInstanceUidToImport,
          this._roiCollectionLabel,
          ROIContourUid
        );

        roiContour.importStatus = DATA_IMPORT_STATUS.IMPORTING;

        // Get loading concurrency preferences
        const preferences = window.store.getState().preferences;
        const ConcurrentPolygonExtraction =
          preferences.experimentalFeatures.ConcurrentPolygonExtraction;
        const concurrentLoadingEnabled =
          !!ConcurrentPolygonExtraction && ConcurrentPolygonExtraction.enabled;

        let polygons = [];

        if (concurrentLoadingEnabled) {
          polygons = await this._extractPolygonsConcurrently(
            ROIContourUid,
            ROINumber,
            polygonItems,
            roiContour
          );
        } else {
          polygons = await this._extractPolygons(
            ROIContourUid,
            ROINumber,
            polygonItems,
            roiContour
          );
        }

        // Reset polygon count
        roiContour.polygonCount = 0;

        this._addPolygonsToToolStateCallback(polygons, 'RTSTRUCT');

        roiContour.importStatus = DATA_IMPORT_STATUS.IMPORTED;
        this._fireContourRoiExtractedEvent(ROIContourUid);

        delete roiContour.loadFunc;
      };

      const ROIContourUid = this._createNewROIContourAndGetUid(
        ROINumber,
        polygonItems.length,
        loadFunc,
        ROIColor
      );
    }
  }

  /**
   * _extractPolygons - extracts ROIContours from the dataset.
   *
   * @param ROIContourUid
   * @param ROINumber
   * @param polygonItems
   * @param roiContour
   * @returns {Array} polygons
   */
  async _extractPolygons(ROIContourUid, ROINumber, polygonItems, roiContour) {
    const polygons = [];
    const numPolygons = polygonItems.length;

    let prevPercentComplete = 0;

    for (let i = 0; i < polygonItems.length; i++) {
      const polygon = this._extractOnePolygon(
        polygonItems[i].dataSet,
        ROIContourUid,
        ROINumber
      );
      if (polygon) {
        polygons.push(polygon);
      }
      const percentComplete = Math.floor(((i + 1) * 100) / numPolygons);
      if (percentComplete !== prevPercentComplete) {
        prevPercentComplete = percentComplete;
        roiContour.importPercent = percentComplete;
        this._fireContourExtractedEvent(ROIContourUid, percentComplete);
        await allowStateUpdate();
      }
    }

    return polygons;
  }

  /**
   * _extractPolygonsConcurrently - Concurrently extracts ROIContours from the dataset.
   *
   * @param ROIContourUid
   * @param ROINumber
   * @param polygonItems
   * @param roiContour
   * @returns {Array} polygons
   */
  async _extractPolygonsConcurrently(
    ROIContourUid,
    ROINumber,
    polygonItems,
    roiContour
  ) {
    const polygons = [];
    const numPolygons = polygonItems.length;
    const byteArray = polygonItems[0].dataSet.byteArray;

    let prevPercentComplete = 0;
    let polygonsExtracted = 0;
    const onWorkerUpdate = data => {
      const { workerId, polygonData } = data;
      if (polygonData) {
        const {
          points,
          referencedSopInstanceUid,
          // polygonUid,
          referencedFrameNumber,
        } = polygonData;
        const polygonUid = generateUID();
        const polygon = new Polygon(
          points,
          referencedSopInstanceUid,
          this._seriesInstanceUidToImport,
          this._roiCollectionLabel,
          ROIContourUid,
          polygonUid,
          referencedFrameNumber
        );
        polygons.push(polygon);
      }
      polygonsExtracted++;
      const percentComplete = Math.floor(
        (polygonsExtracted * 100) / numPolygons
      );
      if (percentComplete !== prevPercentComplete) {
        prevPercentComplete = percentComplete;
        roiContour.importPercent = percentComplete;
        this._fireContourExtractedEvent(ROIContourUid, percentComplete);
        // await allowStateUpdate();
      }
    };

    const maxNumberOfWorkers = 4;
    let arrayStride = Math.floor(numPolygons / maxNumberOfWorkers) || 1;
    let arrayIndex = 0;
    const polygonChunks = [];
    const workers = [];
    let workerId = 0;
    while (arrayIndex < numPolygons) {
      const worker = new RTSPolygonsExtractWorker();
      workers.push(worker);
      const workerPromise = new WebWorkerPromise(worker);
      let arrayEnd = arrayIndex + arrayStride;
      if (numPolygons - arrayEnd <= arrayStride) {
        arrayEnd = numPolygons;
      }
      const subArray = [];
      for (let i = arrayIndex; i < arrayEnd; i++) {
        const dataSet = polygonItems[i].dataSet;
        const elements = dataSet.elements;
        // ContourImageSequence Item 0
        const ImageSequenceElements =
          elements.x30060016.items[0].dataSet.elements;
        subArray.push({
          ContourGeometricType: elements.x30060042,
          ContourImageSequence: {
            ReferencedSOPInstanceUID: ImageSequenceElements.x00081155,
            ReferencedFrameNumber: ImageSequenceElements.x00081160,
          },
          ContourNumber: elements.x30060048,
          NumberOfContourPoints: elements.x30060046,
          ContourData: elements.x30060050,
        });
      }

      polygonChunks.push(
        workerPromise.postMessage(
          {
            ROINumber,
            byteArray,
            polygonItems: subArray,
            sopInstancesInSeries: this._sopInstancesInSeries,
            sopInstanceUid: this._sopInstanceUid,
            workerId: workerId++,
          },
          [],
          (eventName, data) => onWorkerUpdate(data)
        )
      );

      arrayIndex = arrayEnd;
    }
    await Promise.all(polygonChunks);
    workers.forEach(worker => worker.terminate());

    return polygons;
  }

  /**
   * _createNewROIContourAndGetUid - Creates a new ROIContour and returns its UID.
   *
   * @param  {string} ROINumber The index of the ROIContour.
   * @param {number} numPolygons
   * @param {function} loadFunc
   * @param ROIColor
   * @returns {string}  The ROICOntourUid.
   */
  _createNewROIContourAndGetUid(ROINumber, numPolygons, loadFunc, ROIColor) {
    const freehand3DStore = this._freehand3DStore;
    let name;
    let uid;

    uid = `${this._sopInstanceUid}.${this._structureSetLabel}.${ROINumber}`;

    const roiName = this._roiNames[ROINumber];
    if (roiName) {
      name = roiName;
    } else {
      if (this._structureSetName) {
        // StructureSetName is Type 3: Optional
        name = `${this._structureSetName} Lesion ${ROINumber}`;
      } else {
        // StructureSetLabel is Type: Mandatory and not empty
        name = ` ${this._structureSetLabel} Lesion ${ROINumber}`;
      }
    }

    this._addStructureSetIfNotPresent();

    const ROIContourUid = freehand3DStore.setters.ROIContour(
      this._seriesInstanceUidToImport,
      this._roiCollectionLabel,
      name,
      {
        // Auto generate UID to prevent duplicate UID conflicts
        // uid,
        polygonCount: numPolygons,
        importStatus: DATA_IMPORT_STATUS.NOT_IMPORTED,
        loadFunc,
        color: ROIColor,
      }
    );

    return ROIContourUid;
  }

  /**
   * _addStructureSetIfNotPresent - Adds a structureSet to the series if it
   *                                doesn't exist yet.
   *
   * @returns {null}
   */
  _addStructureSetIfNotPresent() {
    const freehand3DStore = this._freehand3DStore;

    const structureSet = freehand3DStore.getters.structureSet(
      this._seriesInstanceUidToImport,
      this._roiCollectionLabel
    );

    if (!structureSet) {
      freehand3DStore.setters.structureSet(
        this._seriesInstanceUidToImport,
        this._roiCollectionName,
        {
          isLocked: true,
          visible: true,
          uid: this._roiCollectionLabel,
        }
      );
    }
  }

  /**
   * _extractOnePolygon - Extracts one polygon from the ROIContour.
   *
   * @param  {object} contourSequenceItemData The dataset for the polygon.
   * @param  {string} ROIContourUid           The UID of the ROIContour.
   * @param  {number} ROINumber               The index of the ROIContour.
   * @returns {null}
   */
  _extractOnePolygon(contourSequenceItemData, ROIContourUid, ROINumber) {
    // Only parse closed polygons
    const contourGeometricType = contourSequenceItemData.string(
      RTStructTag['ContourGeometricType']
    );
    if (contourGeometricType !== 'CLOSED_PLANAR') {
      return;
    }

    const contourImageSequenceData =
      contourSequenceItemData.elements[RTStructTag['ContourImageSequence']]
        .items[0].dataSet;
    const referencedSopInstanceUid = contourImageSequenceData.string(
      RTStructTag['ReferencedSOPInstanceUID']
    );

    // Don't extract polygon if it doesn't belong to the series being imported
    if (!this._sopInstancesInSeries.includes(referencedSopInstanceUid)) {
      return;
    }

    const referencedFrameNumber = contourImageSequenceData.string(
      RTStructTag['ReferencedFrameNumber']
    );
    // const contourNumber = contourSequenceItemData.string(
    //   RTStructTag['ContourNumber']
    // );
    // const polygonUid = `${this._sopInstanceUid}.${ROINumber}.${contourNumber}`;
    const polygonUid = generateUID();

    const points = this._extractPoints(
      contourSequenceItemData,
      referencedSopInstanceUid
    );
    const polygon = new Polygon(
      points,
      referencedSopInstanceUid,
      this._seriesInstanceUidToImport,
      this._roiCollectionLabel,
      ROIContourUid,
      polygonUid,
      referencedFrameNumber
    );

    return polygon;
  }

  /**
   * _extractPoints - Extracts the points of a polygon.
   *
   * @param  {object} contourSequenceItemData  The dataset for the polygon.
   * @param  {string} referencedSopInstanceUid  The sop instance UID referenced
   *                                            by the polygon.
   * @returns {number[]} An array of points.
   */
  _extractPoints(contourSequenceItemData, referencedSopInstanceUid) {
    const points = [];
    const numPoints = contourSequenceItemData.intString(
      RTStructTag['NumberofContourPoints']
    );
    const numValues = numPoints * 3;

    for (let i = 0; i < numValues; i += 3) {
      points.push({
        x: contourSequenceItemData.floatString(RTStructTag['ContourData'], i),
        y: contourSequenceItemData.floatString(
          RTStructTag['ContourData'],
          i + 1
        ),
        z: contourSequenceItemData.floatString(
          RTStructTag['ContourData'],
          i + 2
        ),
      });
    }

    return points;
  }
}

const RadiationTherapyStructureSetStorage = '1.2.840.10008.5.1.4.1.1.481.3';

const RTStructTag = {
  SOPClassUID: 'x00080016',
  SOPInstanceUID: 'x00080018',
  ROIContourSequence: 'x30060039',
  ROINumber: 'x30060022',
  ROIName: 'x30060026',
  ReferencedROINumber: 'x30060084',
  ROIDisplayColor: 'x3006002a',
  ContourSequence: 'x30060040',
  ContourImageSequence: 'x30060016',
  ReferencedSOPInstanceUID: 'x00081155',
  ReferencedFrameNumber: 'x00081160',
  ContourNumber: 'x30060048',
  ContourGeometricType: 'x30060042',
  NumberofContourPoints: 'x30060046',
  ContourData: 'x30060050',
  StructureSetROISequence: 'x30060020',
  ReferencedFrameofReferenceUID: 'x30060024',
  ReferencedFrameofReferenceSequence: 'x30060010',
  FrameofReferenceUID: 'x00200052',
  RTReferencedStudySequence: 'x30060012',
  RTReferencedSeriesSequence: 'x30060014',
  SeriesInstanceUID: 'x0020000e',
  StructureSetName: 'x30060004',
  StructureSetLabel: 'x30060002',
};
