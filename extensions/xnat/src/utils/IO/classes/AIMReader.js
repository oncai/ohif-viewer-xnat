import cornerstoneTools from 'cornerstone-tools';
import Polygon from '../../../peppermint-tools/utils/classes/Polygon';

const modules = cornerstoneTools.store.modules;

/**
 * @class AIMReader - Parses AIM ImageAnnotationCollections and extracts the
 *                    polygons for use in Cornerstone.
 */
export default class AIMReader {
  constructor(
    xmlDocument,
    seriesInstanceUidToImport,
    roiCollectionName,
    roiCollectionLabel
  ) {
    this._doc = xmlDocument;

    try {
      this._checkXML();
    } catch (err) {
      console.log(err.message);
    }

    this._freehand3DStore = modules.freehand3D;

    this._seriesInstanceUidToImport = seriesInstanceUidToImport;
    this._polygons = [];
    this._sopInstancesInSeries = this._getSopInstancesInSeries();
    this._roiCollectionName = roiCollectionName;
    this._roiCollectionLabel = roiCollectionLabel;
    this._extractAnnotations();
  }

  /**
   * _checkXML - Checks if this._doc is a Document, and whether it is an AIM 4.0
   *             file.
   *
   * @returns {null}
   */
  _checkXML() {
    if (!(this._doc instanceof Document)) {
      throw 'Input is not of type Document!';
    }

    if (!this._checkIfAIMv4_0()) {
      throw 'Input is not an AIMv4_0 ImageAnnotationCollection file!';
    }
  }

  /**
   * _checkIfAIMv4_0 - Checks if this._doc is an AIM 4.0 file.
   *
   * @returns {boolean} True if the file is a valid AIM 4.0 file.
   */
  _checkIfAIMv4_0() {
    const imageAnnotationCollections = this._doc.getElementsByTagName(
      'ImageAnnotationCollection'
    );
    if (imageAnnotationCollections.length === 0) {
      return false;
    }
    const aimVersion = imageAnnotationCollections[0].getAttribute('aimVersion');
    if (aimVersion !== 'AIMv4_0') {
      return false;
    }

    return true;
  }

  /**
   * _getSopInstancesInSeries - Extracts all the sopInstanceUids referenced in
   *                            the file that are associated with the active
   *                            series.
   *
   * @returns {string[]}  An array of the sopInstanceUids.
   */
  _getSopInstancesInSeries() {
    let sopInstancesInSeries = [];
    const imageSeriesList = this._doc.getElementsByTagName('imageSeries');

    if (imageSeriesList.length === 0) {
      throw 'No image series information in AIM file!';
    }

    for (let i = 0; i < imageSeriesList.length; i++) {
      const seriesInstanceUid = this._getSeriesInstanceUid(imageSeriesList[i]);

      if (seriesInstanceUid === this._seriesInstanceUidToImport) {
        this._appendSopInstances(sopInstancesInSeries, imageSeriesList[i]);
      }
    }

    return sopInstancesInSeries;
  }

  /**
   * _getSeriesInstanceUid - Returns the series instance UID for a given
   *                         AIM imageSeries.
   *
   * @param  {HTMLElement} imageSeries The imageSeries node.
   * @returns {string}  The series instance UID.
   */
  _getSeriesInstanceUid(imageSeries) {
    const seriesInstanceUidElement = imageSeries.getElementsByTagName(
      'instanceUid'
    )[0];
    const seriesInstanceUid = seriesInstanceUidElement.getAttribute('root');

    return seriesInstanceUid;
  }

  /**
   * _appendSopInstances - Add all the sop instance UIDs in the AIM imageSeries
   *                       to the sopInstancesInSeries array.
   *
   * @param  {string[]} sopInstancesInSeries The array of sop instance UIDs.
   * @param  {HTMLElement} imageSeries          The AIM imageSeries to parse.
   * @modifies sopInstancesInSeries
   * @returns {null}
   */
  _appendSopInstances(sopInstancesInSeries, imageSeries) {
    const sopInstanceUidElements = imageSeries.getElementsByTagName(
      'sopInstanceUid'
    );
    for (let i = 0; i < sopInstanceUidElements.length; i++) {
      const sopInstanceUid = sopInstanceUidElements[i].getAttribute('root');
      if (!sopInstancesInSeries.includes(sopInstanceUid)) {
        sopInstancesInSeries.push(sopInstanceUid);
      }
    }
  }

  /**
   * _extractAnnotations - Extracts each annotation from the AIM file.
   *
   * @returns {null}
   */
  _extractAnnotations() {
    const annotations = this._doc.getElementsByTagName('ImageAnnotation');

    for (let i = 0; i < annotations.length; i++) {
      this._extractPolygons(annotations[i]);
    }
  }

  /**
   * _extractPolygons - Extracts each polygon from a particular annotation.
   *
   * @param  {HTMLElement} annotation An AIM ImageAnnotation.
   * @returns {null}
   */
  _extractPolygons(annotation) {
    const children = annotation.children;
    const ROIContourUid = this._createNewVolumeAndGetUid(children);
    const markupEntitys = annotation.getElementsByTagName('MarkupEntity');

    for (let i = 0; i < markupEntitys.length; i++) {
      this._addMarkupEntityIfPolygon(markupEntitys[i], ROIContourUid);
    }
  }

  /**
   * _addMarkupEntityIfPolygon - Adds a MarkupEntity to the polygon list if
   * is of the xsi:type "TwoDimensionPolyline"
   *
   * @param  {HTMLElement} markupEntity  The AIM MarkupEntity
   * @param  {string} ROIContourUid The UID of the new ROIContour.
   * @returns {null}
   */
  _addMarkupEntityIfPolygon(markupEntity, ROIContourUid) {
    if (markupEntity.getAttribute('xsi:type') === 'TwoDimensionPolyline') {
      this._addPolygon(markupEntity, ROIContourUid);
    }
  }

  /**
   * _addPolygon - Adds a polygon to the list of polygons.
   *
   * @param  {HTMLElement} markupEntity  The AIM MarkupEntity
   * @param  {string} ROIContourUid The UID of the new ROIContour.
   * @returns {null}
   */
  _addPolygon(markupEntity, ROIContourUid) {
    const sopInstanceUid = markupEntity
      .getElementsByTagName('imageReferenceUid')[0]
      .getAttribute('root');

    // Don't extract polygon if it doesn't belong to the series being imported
    if (!this._sopInstancesInSeries.includes(sopInstanceUid)) {
      return;
    }

    const polygonUid = markupEntity
      .getElementsByTagName('uniqueIdentifier')[0]
      .getAttribute('root');
    const referencedFrameNumber = markupEntity
      .getElementsByTagName('referencedFrameNumber')[0]
      .getAttribute('value');
    const twoDimensionSpatialCoordinateCollection = markupEntity.getElementsByTagName(
      'twoDimensionSpatialCoordinateCollection'
    )[0].children;

    const points = [];

    // NOTE: itterate up to length - 1, as first and last points are the same for closed polygons.
    for (
      let i = 0;
      i < twoDimensionSpatialCoordinateCollection.length - 1;
      i++
    ) {
      points.push({
        x: Number(
          twoDimensionSpatialCoordinateCollection[i]
            .getElementsByTagName('x')[0]
            .getAttribute('value')
        ),
        y: Number(
          twoDimensionSpatialCoordinateCollection[i]
            .getElementsByTagName('y')[0]
            .getAttribute('value')
        ),
      });
    }

    const polygon = new Polygon(
      points,
      sopInstanceUid,
      this._seriesInstanceUidToImport,
      this._roiCollectionLabel,
      ROIContourUid,
      polygonUid,
      referencedFrameNumber
    );
    this._polygons.push(polygon);
  }

  /**
   * _createNewVolumeAndGetUid - Creates a new ROIContour and returns the UID.
   *
   * @param  {HTMLElement} childElementsOfAnnotation The child elements of an AIM
   *                                          ImageAnnotation.
   * @returns {string}  The ROIContourUid of the new contour.
   */
  _createNewVolumeAndGetUid(childElementsOfAnnotation) {
    const freehand3DStore = this._freehand3DStore;
    let name;
    let uid;
    let comment;

    for (let i = 0; i < childElementsOfAnnotation.length; i++) {
      if (childElementsOfAnnotation[i].tagName === 'uniqueIdentifier') {
        uid = childElementsOfAnnotation[i].getAttribute('root');
      } else if (childElementsOfAnnotation[i].tagName === 'name') {
        name = childElementsOfAnnotation[i].getAttribute('value');
      } else if (childElementsOfAnnotation[i].tagName === 'comment') {
        comment = childElementsOfAnnotation[i].getAttribute('value');
      }
    }

    if (!uid) {
      throw Error('Invalid AIM, no imageAnnotation uniqueIdentifier found!');
    }
    if (!name) {
      if (comment) {
        name = comment;
      } else {
        console.log(
          'No name or comment for imageAnnotation, using default name "Untitled Lession"'
        );
        name = 'Untitled Lession';
      }
    }

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

    const ROIContourUid = freehand3DStore.setters.ROIContour(
      this._seriesInstanceUidToImport,
      this._roiCollectionLabel,
      name,
      {
        uid,
      }
    );

    return ROIContourUid;
  }

  get polygons() {
    return this._polygons;
  }
}
