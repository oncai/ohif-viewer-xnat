import cloneDeep from 'lodash.clonedeep';
import moment from 'moment';
import { version } from '../../../../../package.json';

/**
 * @typedef {object} XNATImageMeasurementCollection
 * @property {object} metadata
 * @property {object} imageReference
 * @property {object} xnatMetadata
 * @property {object} tracking
 * @property {object} user
 * @property {object} subject
 * @property {object} equipment
 * @property {object} internal
 * @property {ImageMeasurement[]} measurements
 */

/**
 * @typedef {object} metadata
 * @property {String} uuid
 * @property {String} name - max 64 characters
 * @property {String} description - max 64 characters
 */

/**
 * @typedef {object} imageReference
 * @property {string} PatientID
 * @property {String} StudyInstanceUID
 * @property {String} SeriesInstanceUID
 * @property {image[]} imageCollection - reference of images for all measurements
 */

/**
 * @typedef {object} image
 * @property {String} SOPInstanceUID
 * @property {number} frameIndex - default 0, but varies in multi-frame data
 */

/**
 * @typedef {object} xnatMetadata
 * @property {String} label - XNAT RoiCollection label
 * @property {String} collectionId - XNAT RoiCollection ID
 */

/**
 * @typedef {object} tracking
 * @property {datetime} created timestamp
 * @property {datetime} modified timestamp - null for the first export
 * @property {number} revision number incremented on each export
 */

/**
 * @typedef {object} user
 * @property {String} name
 * @property {String} loginName
 */

/**
 * @typedef {object} subject
 * @property {String} name
 * @property {String} id
 * @property {String} birthDate
 */

/**
 * @typedef {object} equipment
 * @property {String} manufacturerName
 * @property {String} manufacturerModelName
 * @property {String} softwareVersion
 */

/**
 * @typedef {object} internal
 * @property {boolean} imported - whether the collection is imported
 * @property {boolean} visible - Whether the collection should be rendered
 * @property {string} displaySetInstanceUID
 */

export default class ImageMeasurementCollection {
  constructor(props) {
    this._measurements = new Map();

    const { paras, imported = false } = props;

    if (!imported) {
      this.initWorkingCollection(paras);
    } else {
      this.initImportedCollection(paras);
    }
  }

  initWorkingCollection(paras) {
    const {
      PatientID,
      PatientName,
      PatientBirthDate,
      StudyInstanceUID,
      SeriesInstanceUID,
      displaySetInstanceUID,
    } = paras;
    const userInfo = window.ohif.userInfo || {
      loginName: '',
      name: '',
    };
    this.metadata = {
      uuid: _generateUUID(),
      name: '',
      description: '',
    };
    this.imageReference = {
      PatientID,
      StudyInstanceUID,
      SeriesInstanceUID,
      imageCollection: [],
    };
    this.xnatMetadata = {
      label: '',
      collectionId: '',
    };
    this.tracking = {
      created: moment().format('YYYYMMDD HH:mm:ss.SSS'),
      modified: '',
      revision: 1,
    };
    this.user = {
      name: userInfo.name,
      loginName: userInfo.loginName,
    };
    this.subject = {
      name: PatientName,
      id: PatientID,
      birthDate: PatientBirthDate,
    };
    this.equipment = {
      manufacturerName: '',
      manufacturerModelName: 'XNAT-OHIF-Viewer',
      softwareVersion: version.toUpperCase(),
    };
    this.internal = {
      locked: false,
      imported: false,
      visible: true,
      displaySetInstanceUID,
    };
  }

  initImportedCollection(paras) {
    const { collectionObject, displaySetInstanceUID } = paras;
    const {
      uuid,
      name,
      description,
      created,
      modified,
      revision,
      imageReference,
      user,
      subject,
      equipment,
      imageMeasurements,
    } = collectionObject;
    this.metadata = {
      uuid,
      name,
      description,
    };
    this.imageReference = { ...imageReference };
    this.xnatMetadata = {
      label: '',
      collectionId: '',
    };
    this.tracking = {
      created,
      modified,
      revision,
    };
    this.user = { ...user };
    this.subject = { ...subject };
    this.equipment = { ...equipment };
    this.internal = {
      locked: true,
      imported: true,
      visible: true,
      displaySetInstanceUID,
    };
  }

  get measurements() {
    return Array.from(this._measurements.values());
  }

  addMeasurement(measurement) {
    const { uuid } = measurement.metadata;
    this._measurements.set(uuid, measurement);
  }

  getMeasurement(uuid) {
    return this._measurements.get(uuid);
  }

  removeMeasurement(uuid) {
    this._measurements.delete(uuid);
  }

  resetMetadata() {
    // this.metadata.uuid = _generateUUID();
    this.metadata.name = '';
    this.metadata.description = '';
  }

  generateDataObject(selectedMeasurements) {
    // Build imageReference
    const imageCollection = this.imageReference.imageCollection;
    const imageMeasurements = [];
    selectedMeasurements.forEach(measurement => {
      const imageReference = measurement.imageReference;
      imageCollection.push({
        ...imageReference,
      });
      imageMeasurements.push(measurement.generateDataObject());
    });

    const collectionObject = {
      ...this.metadata,
      ...this.tracking,
      user: { ...this.user },
      subject: { ...this.subject },
      equipment: { ...this.equipment },
      imageReference: { ...this.imageReference },
      imageMeasurements,
    };

    return cloneDeep(collectionObject);
  }
}

/**
 * _generateUUID - generates a UUID.
 *
 * @returns {string} The generated UUID.
 */
const _generateUUID = () => {
  // https://stackoverflow.com/a/8809472/9208320 Public Domain/MIT
  let d = new Date().getTime();

  if (
    typeof performance !== 'undefined' &&
    typeof performance.now === 'function'
  ) {
    d += performance.now(); // Use high-precision timer if available
  }

  return 'x.x.x.x.x.x.xxxx.xxx.x.x.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(
    /[xy]/g,
    function(c) {
      const r = (d + Math.random() * 16) % 16 | 0;

      d = Math.floor(d / 16);

      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    }
  );
};
