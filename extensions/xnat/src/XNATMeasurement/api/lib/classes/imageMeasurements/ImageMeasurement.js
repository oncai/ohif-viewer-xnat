import { getAnatomyCoding, getMeasurementUnits } from '../../../../utils';

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
    const { imageId, Modality } = props.imageAttributes;
    this._measurementUnits = getMeasurementUnits(imageId, Modality);

    if (!isImported) {
      this.initNew(props);
    } else {
      this.initImported(props);
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

  initImported(props) {
    const { collectionUID, measurementObject, imageAttributes } = props;

    // measurementObject
    const {
      uuid,
      name,
      description,
      codingSequence,
      color,
      lineThickness,
      dashedLine,
      visible,
      viewport,
      data,
    } = measurementObject;

    // imageReference
    const {
      StudyInstanceUID,
      SeriesInstanceUID,
      SOPInstanceUID,
      frameIndex,
      imageId,
      displaySetInstanceUID,
    } = imageAttributes;

    const genericToolType = this.constructor.genericToolType;
    const toolType = this.constructor.toolType;

    this._xnat = {
      metadata: {
        uuid,
        toolType: genericToolType,
        name,
        description,
        codingSequence,
        color,
        lineThickness,
        dashedLine,
        visible,
      },
      imageReference: {
        SOPInstanceUID,
        frameIndex,
      },
      viewport,
      internal: {
        locked: true,
        imported: true,
        active: false,
        modified: false,
        icon: this.constructor.icon,
        StudyInstanceUID,
        SeriesInstanceUID,
        displaySetInstanceUID,
        imageId,
        collectionUID,
      },
    };

    const measurementData = {
      ...data,
      active: false,
      color,
      invalidated: true,
      uuid,
      visible,
      toolType,
      toolName: toolType,
    };

    measurementData.measurementReference = {
      toolType,
      genericToolType,
      uuid,
      StudyInstanceUID,
      SeriesInstanceUID,
      displaySetInstanceUID,
      imageId,
      collectionUID,
    };

    this._csMeasurementData = measurementData;
  }

  get measurementUnits() {
    return this._measurementUnits;
  }

  get metadata() {
    return this._xnat.metadata;
  }

  get viewport() {
    return this._xnat.viewport;
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

  unlockToWorking(collectionUID) {
    const { internal } = this._xnat;
    internal.locked = false;
    internal.collectionUID = collectionUID;

    const { measurementReference } = this._csMeasurementData;
    measurementReference.collectionUID = collectionUID;
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
    const dataObject = {
      ...this._xnat.metadata,
      imageReference: { ...this._xnat.imageReference },
      viewport: { ...this._xnat.viewport },
      data: {},
      measurements: [],
    };

    return dataObject;
  }
}
