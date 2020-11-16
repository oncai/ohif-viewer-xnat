import ApiWrapper from './ApiWrapper.js';
import AIAA_TOOL_TYPES from '../toolTypes.js';
import createDicomVolume from '../utils/createDicomVolume.js';
import prepareRunParameters from '../utils/prepareRunParameters.js';
import showNotification from '../../components/common/showNotification';
import csTools from 'cornerstone-tools';
import { saveFile } from '../../utils/xnatDev.js';

const modules = csTools.store.modules;

const SESSION_ID_PREFIX = 'AIAA_SESSION_ID_';
const SESSION_EXPIRY = 2 * 60 * 60; //in seconds

export default class AIAAClient {
  constructor() {
    this._aiaaModule = modules.aiaa;
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

  runModel = async parameters => {
    const { SeriesInstanceUID, imageIds } = parameters;
    let session_id = await this._getSession(SeriesInstanceUID)

    // Create session if not available
    if (session_id === null) {
      const res = await this._createSession(SeriesInstanceUID, imageIds);
      if (!res) {
        return;
      }
      session_id =
        this._getCookie(`${SESSION_ID_PREFIX}${SeriesInstanceUID}`);
    }

    // Construct run parameters
    const runParams = prepareRunParameters({
      model: this.currentModel,
      fgPoints: [],
      bgPoints: [],
    });

    showNotification(
      `Running ${this.currentModel.name}, please wait...`,
      'info',
      'NVIDIA AIAA'
    );

    // Request to run model on AIAA server
    const response = await this.api.runModel(
      runParams.apiUrl,
      runParams.params,
      this.currentModel.name,
      session_id
    );

    if (response.status === 200) {
      const data = response.data;
      const imageBlob = new Blob([data],
        { type: 'application/octet-stream' });
      saveFile(imageBlob, 'mask.nrrd');
      console.log('Done!');
    } else {
      showNotification(
        `Failed to run ${this.currentModel.name}! Reason: ${response.data}`,
        'error',
        'NVIDIA AIAA'
      );
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
    const useNifti = false;

    showNotification(
      'Creating a new AIAA Session, please wait...',
      'info',
      'NVIDIA AIAA'
    );

    const volumeBuffer = await createDicomVolume(imageIds);
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