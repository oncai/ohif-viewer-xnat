import ApiWrapper from './ApiWrapper';
import { MONAI_TOOL_TYPES } from '../../monailabel-tools';
import showNotification from '../../../components/common/showNotification';
import NIFTIReader from '../../../utils/IO/classes/NIFTIReader/NIFTIReader';
import common from '../../../common';
import cloneDeep from 'lodash.clonedeep';
import sessionMap from '../../../utils/sessionMap';

const {
  createDicomVolume,
  createNiftiVolume,
  readNrrd,
} = common.utils.reformat;

const SESSION_ID_PREFIX = 'MONAI_SESSION_ID_';
const SESSION_EXPIRY = 2 * 60 * 60; //in seconds
const USE_NIFTI = true;

export default class MONAIClient {
  constructor() {
    this.api = new ApiWrapper('');
    this.isConnected = false;
    this.isSuccess = true;
    this.models = [];
    this.currentTool = MONAI_TOOL_TYPES[0];
    this.currentModel = null;
  }

  getModels = async () => {
    const response = await this.api.getModels();
    if (response.status !== 200) {
      showNotification(
        `Failed to fetch models! Reason: ${response.data}`,
        'error',
        'MONAILabel'
      );

      this.isConnected = false;
      this.models = [];

      return false;
    }

    this.isConnected = true;

    const data = response.data;
    const models = cloneDeep(data.models);
    this.models = Object.keys(models).map(key => ({
      ...models[key],
      name: key,
    }));

    return true;
  };

  runModel = async (parameters, updateStatusModal) => {
    const { SeriesInstanceUID, imageIds, segmentPoints } = parameters;

    const { projectId, subjectId, experimentId } = sessionMap.getScan(
      SeriesInstanceUID
    );
    const scanId = imageIds[0].split('/scans/')[1].split('/')[0];
    const monaiImageId = `${projectId}/${subjectId}/${experimentId}/${scanId}`;

    const imageInfo = await this.api.getImageInfo(monaiImageId);
    const hasXnatDatastore =
      imageInfo.status === 200 && imageInfo.data && !_.isEmpty(imageInfo.data);

    let session_id = null;
    if (!hasXnatDatastore) {
      updateStatusModal('Getting MONAILabel session info ...');
      session_id = await this._getSession(SeriesInstanceUID);

      // Create session if not available
      if (session_id === null) {
        updateStatusModal('Creating a new MONAILabel session ...');
        const res = await this._createSession(SeriesInstanceUID, imageIds);
        if (!res) {
          return null;
        }
        session_id = this._getCookie(`${SESSION_ID_PREFIX}${SeriesInstanceUID}`);
      }
    }

    let fgPoints = [];
    let bgPoints = [];
    if (!_.isEmpty(segmentPoints)) {
      if (USE_NIFTI) {
        const maxZ = imageIds.length - 1;
        for (let p of segmentPoints.fg) {
          fgPoints.push([p[0], p[1], maxZ - p[2]]);
        }
        for (let p of segmentPoints.bg) {
          bgPoints.push([p[0], p[1], maxZ - p[2]]);
        }
      } else {
        fgPoints = segmentPoints.fg;
        bgPoints = segmentPoints.bg;
      }
    }

    // Construct run parameters
    const params = {
      result_extension: USE_NIFTI ? '.nii.gz' : '.nrrd',
      result_dtype: 'uint16',
      result_compress: true,
      // Points
      foreground: fgPoints,
      background: bgPoints,
    };

    updateStatusModal(`Running ${this.currentModel.name}, please wait...`);

    // Request to run model on MONAILabel server
    const response = await this.api.runModel(
      this.currentModel.name,
      params,
      session_id,
      monaiImageId
    );

    if (response.status === 200) {
      if (USE_NIFTI) {
        const niftiReader = new NIFTIReader(imageIds);
        const { image, maskImageSize } = await niftiReader.loadFromArrayBuffer(response.data);
        return { data: image, size: maskImageSize };
      } else {
        const { image, maskImageSize } = readNrrd(response.data);
        return { data: image, size: maskImageSize };
      }
    } else {
      showNotification(
        `Failed to run ${this.currentModel.name}! Reason: ${response.data}`,
        'error',
        'MONAILabel'
      );
      return null;
    }
  };

  _getSession = async SeriesInstanceUID => {
    let session_id = null;

    // check if session is available
    const sessionID_cookie = this._getCookie(
      `${SESSION_ID_PREFIX}${SeriesInstanceUID}`
    );
    if (sessionID_cookie) {
      const response = await this.api.getSession(sessionID_cookie, true);
      if (response.status === 200) {
        session_id = sessionID_cookie;
      }
    }

    return session_id;
  };

  _createSession = async (SeriesInstanceUID, imageIds) => {
    let res = false;

    showNotification(
      'Creating a new MONAILabel Session, please wait...',
      'info',
      'MONAILabel'
    );

    let volumeBuffer;
    if (USE_NIFTI) {
      const niftiBuffer = await createNiftiVolume(imageIds);
      volumeBuffer = {
        data: new Blob([niftiBuffer],
          { type: 'application/octet-stream' }),
        name: 'image.nii.gz',
      };
    } else {
      volumeBuffer = await createDicomVolume(imageIds);
    }

    const response =
      await this.api.createSession(volumeBuffer, null, SESSION_EXPIRY);

    if (response.status === 200) {
      const { session_id } = response.data;
      this._setCookie(
        `${SESSION_ID_PREFIX}${SeriesInstanceUID}`,
        session_id
      );
      res = true;

      showNotification(
        'MONAILabel Session was created successfully',
        'success',
        'MONAILabel'
      );
    } else {
      showNotification(
        `Failed to create MONAILabel Session! Reason: ${response.data}`,
        'error',
        'MONAILabel'
      );
    }

    return res;
  };

  _setCookie = (name, value) => {
    document.cookie = `${name}=${escape(value)}`;
  };

  _getCookie = (name) => {
    let value = null;

    if (document.cookie !== '') {
      const result = document.cookie
        .split('; ')
        .find(row => row.startsWith(name));
      if (result) {
        value = unescape(result.split('=')[1]);
      }
    }

    return value;
  };
}
