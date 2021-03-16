import ApiWrapper from './ApiWrapper.js';
import AIAA_TOOL_TYPES from '../toolTypes.js';
import createDicomVolume from '../utils/createDicomVolume.js';
import createNiftiVolume from '../utils/createNiftiVolume.js';
import prepareRunParameters from '../utils/prepareRunParameters.js';
import readNrrd from '../utils/readNrrd.js';
import readNifti from '../utils/readNifti.js';
import showNotification from '../../components/common/showNotification';
import { saveFile, readFile } from '../../utils/xnatDev.js';
import testModelList from './testModelList.js';

const SESSION_ID_PREFIX = 'AIAA_SESSION_ID_';
const SESSION_EXPIRY = 2 * 60 * 60; //in seconds
const USE_NIFTI = true;

export default class AIAAClient {
  constructor() {
    this.api = new ApiWrapper('');
    this.isConnected = false;
    this.isSuccess = true;
    this.models = [];
    this.currentTool = AIAA_TOOL_TYPES[0];
    this.currentModel = null;
  }

  getModels = async () => {
    const response = await this.api.getModels();
    if (response.status !== 200) {
      showNotification(
        `Failed to fetch models! Reason: ${response.data}`,
        'error',
        'NVIDIA AIAA'
      );

      this.isConnected = false;
      this.models = [];

      return false;
    }

    // showNotification(
    //   'Fetched available models',
    //   'success',
    //   'NVIDIA AIAA'
    // );

    this.isConnected = true;
    this.models = response.data;

    return true;
  }

  runModel = async (parameters, updateStatusModal) => {
    const { SeriesInstanceUID, imageIds, segmentPoints } = parameters;
    updateStatusModal('Getting AIAA session info ...');
    let session_id = await this._getSession(SeriesInstanceUID)

    // Create session if not available
    if (session_id === null) {
      updateStatusModal('Creating a new AIAA session ...');
      const res = await this._createSession(SeriesInstanceUID, imageIds);
      if (!res) {
        return null;
      }
      session_id =
        this._getCookie(`${SESSION_ID_PREFIX}${SeriesInstanceUID}`);
    }

    // Construct run parameters
    let fgPoints = [];
    let bgPoints = [];
    if (!_.isEmpty(segmentPoints)) {
      fgPoints = segmentPoints.fg;
      bgPoints = segmentPoints.bg;
    }
    const runParams = prepareRunParameters({
      model: this.currentModel,
      fgPoints: fgPoints,
      bgPoints: bgPoints,
    }, USE_NIFTI);

    updateStatusModal(`Running ${this.currentModel.name}, please wait...`);
    // showNotification(
    //   `Running ${this.currentModel.name}, please wait...`,
    //   'info',
    //   'NVIDIA AIAA'
    // );

    // Request to run model on AIAA server
    const response = await this.api.runModel(
      runParams.apiUrl,
      runParams.params,
      this.currentModel.name,
      session_id
    );

    if (response.status === 200) {
      // const imageBlob = new Blob([response.data],
      //   { type: 'application/octet-stream' });
      // saveFile(imageBlob, 'mask_image');
      if (USE_NIFTI) {
        const { image, maskImageSize } = await readNifti(response.data);
        return { data: image, size: maskImageSize };
      } else {
        const { image, maskImageSize } = readNrrd(response.data);
        return { data: image, size: maskImageSize };
      }
    } else {
      showNotification(
        `Failed to run ${this.currentModel.name}! Reason: ${response.data}`,
        'error',
        'NVIDIA AIAA'
      );
      return null;
    }
  }

  getTestModels = async () => {
    this.isConnected = true;
    this.models = testModelList;

    return true;
  }

  readTestFile = async (imageIds) => {
    const buffer = await readFile();
    if (buffer === null) {
      return null;
    }

    if (USE_NIFTI) {
      const { image, maskImageSize } = await readNifti(buffer);
      return { data: image, size: maskImageSize };
    } else {
      const { image, maskImageSize } = readNrrd(buffer);
      return { data: image, size: maskImageSize };
    }
  }

  _getSession = async SeriesInstanceUID => {
    let session_id = null;

    // check if session is available
    const sessionID_cookie =
      this._getCookie(`${SESSION_ID_PREFIX}${SeriesInstanceUID}`);
    if (sessionID_cookie) {
      const response = await this.api.getSession(sessionID_cookie, true);
      if (response.status === 200) {
        session_id = sessionID_cookie;
      }
    }

    return session_id;
  }

  _createSession = async (SeriesInstanceUID, imageIds) => {
    let res = false;

    showNotification(
      'Creating a new AIAA Session, please wait...',
      'info',
      'NVIDIA AIAA'
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
        'AIAA Session was created successfully',
        'success',
        'NVIDIA AIAA'
      );

    } else {
      showNotification(
        `Failed to create AIAA Session! Reason: ${response.data}`,
        'error',
        'NVIDIA AIAA'
      );
    }

    return res;
  }

  _setCookie = (name, value) => {
    document.cookie = `${name}=${escape(value)}`;
  }

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
  }
}
