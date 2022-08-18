import { getAnatomyCoding } from '../../../../utils';

export default class ImageMeasurement {
  static get genericToolType() {
    throw new Error(
      `Method genericToolType not implemented for base class ImageMeasurement.`
    );
  }

  static get toolType() {
    throw new Error(
      `Method toolType not implemented for base class ImageMeasurement.`
    );
  }

  static get icon() {
    throw new Error(
      `Method icon not implemented for base class ImageMeasurement.`
    );
  }

  constructor(isImported, props) {
    if (!isImported) {
      this.initNew(props);
    }
  }

  initNew(props, options) {
    const { collectionUID, measurementData, imageAttributes, viewport } = props;
    const { uuid, color } = measurementData;

    // imageReference
    const {
      StudyInstanceUID,
      SeriesInstanceUID,
      SOPInstanceUID,
      frameIndex,
      imageId,
      displaySetInstanceUID,
    } = imageAttributes;

    this._xnat = {
      metadata: {
        uuid,
        toolType: this.constructor.genericToolType,
        name: 'Unnamed measurement',
        description: '',
        codingSequence: [
          getAnatomyCoding({
            categoryUID: 'T-D0050',
            typeUID: 'T-D0050',
          }),
        ],
        color,
        lineThickness: 1,
        dashedLine: false,
        visible: true,
      },
      imageReference: {
        SOPInstanceUID,
        frameIndex,
      },
      viewport,
      internal: {
        locked: false,
        imported: false,
        active: false,
        modified: true,
        icon: this.constructor.icon,
        StudyInstanceUID,
        SeriesInstanceUID,
        displaySetInstanceUID,
        imageId,
        collectionUID,
      },
      data: {}, // Data exchange, measurement type-specific
    };

    measurementData.measurementReference = {
      toolType: this.constructor.toolType,
      genericToolType: this.constructor.genericToolType,
      uuid,
      StudyInstanceUID,
      SeriesInstanceUID,
      displaySetInstanceUID,
      imageId,
      collectionUID,
    };
    this._csMeasurementData = measurementData;
  }

  get metadata() {
    return this._xnat.metadata;
  }

  get internal() {
    return this._xnat.internal;
  }

  get imageReference() {
    return this._xnat.imageReference;
  }

  updateMetadata(newMetadata) {
    this._xnat.metadata = {
      ...this._xnat.metadata,
      ...newMetadata,
    };
  }

  /**
   * Cornerstone measurement data
   */
  get csData() {
    return this._csMeasurementData;
  }

  /**
   * @returns {JSX.Element}
   */
  get displayText() {
    throw new Error(
      `Method displayText not implemented for base class ImageMeasurement.`
    );
  }

  generateDataObject() {
    this._dataObject = {
      ...this._xnat.metadata,
      imageReference: { ...this._xnat.imageReference },
      viewport: { ...this._xnat.viewport },
    };
  }
}
