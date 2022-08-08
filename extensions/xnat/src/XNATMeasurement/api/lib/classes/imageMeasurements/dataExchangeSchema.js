/**
 * @typedef {object} XNATImageMeasurement
 * @property {object} metadata
 * @property {object} imageReference
 * @property {object} viewport
 * @property {object} internal
 * @property {object} data - data exchange, measurement type-specific, including measurement unit
 */

/**
 * @typedef {object} metadata
 * @property {String} uuid
 * @property {string} toolType
 * @property {String} name - max 64 characters
 * @property {String} description - max 64 characters
 * @property {object[]} codingSequence
 * @property {String} color - rgba(255,255,255,1.0)
 * @property {number} lineThickness - [1]
 * @property {boolean} dashedLine - [false]
 * @property {boolean} visible
 */

/**
 * @typedef {object} imageReference
 * @property {String} SOPInstanceUID
 * @property {number} frameIndex - default 0, but varies in multi-frame data
 */

/**
 * @typedef {object} internal
 * @property {boolean} locked - whether the measurement is locked from editing
 * @property {boolean} imported - whether the measurement is imported
 * @property {boolean} active
 * @property {boolean} modified - the measurement was modified after import
 * @property {string} icon
 * @property {String} StudyInstanceUID
 * @property {String} SeriesInstanceUID
 * @property {string} displaySetInstanceUID
 * @property {string} imageId
 * @property {string} collectionUid
 */
