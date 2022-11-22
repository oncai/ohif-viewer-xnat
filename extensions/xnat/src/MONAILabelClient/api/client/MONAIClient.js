import ApiWrapper from './ApiWrapper';
import { MONAI_TOOL_TYPES } from '../../monailabel-tools';
import MONAI_MODEL_TYPES from '../modelTypes';
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
    this.appLabels = [];
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

    const allLabels = [...data.labels];
    if (!allLabels.includes('background')) {
      allLabels.unshift('background');
    }
    const appLabels = { allLabels };
    this.models.forEach(model => {
      const modelLabels = [];
      const valueMap = [0];
      const srcLabels = Array.isArray(model.labels)
        ? model.labels
        : Object.keys(model.labels);
      const labelNames = [];
      srcLabels.forEach(
        label => label !== 'background' && labelNames.push(label)
      );
      for (let i = 0; i < labelNames.length; i++) {
        const label = labelNames[i];
        let segIndex = allLabels.indexOf(label);
        if (segIndex < 0) {
          allLabels.push(label);
          segIndex = allLabels.length - 1;
        }
        const value = i + 1;
        modelLabels.push({ label, segIndex, value });
        valueMap.push(segIndex);
      }
      appLabels[model.name] = {
        labels: modelLabels,
        valueMap,
      };
    });

    this.appLabels = appLabels;

    return true;
  };

  runModel = async (parameters, updateStatusModal) => {
    const {
      SeriesInstanceUID,
      imageIds,
      segmentPoints,
      activeSegmentIndex,
    } = parameters;

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
        session_id = this._getCookie(
          `${SESSION_ID_PREFIX}${SeriesInstanceUID}`
        );
      }
    }

    let fgPoints = [];
    let bgPoints = [];
    if (segmentPoints) {
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
      result_dtype: 'uint8',
      result_compress: true,
      // Points
      foreground: fgPoints,
      background: bgPoints,
    };

    // if (this.currentModel.type === MONAI_MODEL_TYPES.DEEPGROW) {
    //   params.label = 'spleen';
    // }

    updateStatusModal(`Running ${this.currentModel.name}, please wait...`);

    // Request to run model on MONAILabel server
    const response = await this.api.runModel(
      this.currentModel.name,
      params,
      session_id,
      monaiImageId
    );

    if (response.status === 200) {
      const maskImage = { data: undefined, size: undefined };
      if (USE_NIFTI) {
        const niftiReader = new NIFTIReader(imageIds);
        const { image, maskImageSize } = await niftiReader.loadFromArrayBuffer(
          response.data
        );
        maskImage.data = image;
        maskImage.size = maskImageSize;
      } else {
        const { image, maskImageSize } = readNrrd(response.data);
        maskImage.data = image;
        maskImage.size = maskImageSize;
      }
      return this._fixLabelMapping(maskImage, activeSegmentIndex);
    } else {
      showNotification(
        `Failed to run ${this.currentModel.name}! Reason: ${response.data}`,
        'error',
        'MONAILabel'
      );
      return null;
    }
  };

  _fixLabelMapping(maskImage, activeSegmentIndex) {
    const { data, size } = maskImage;
    const sliceLengthInBytes = data.byteLength / size.numberOfFrames;
    const sliceLength = size.width * size.height;
    const bytesPerVoxel = sliceLengthInBytes / sliceLength;

    if (bytesPerVoxel !== 1 && bytesPerVoxel !== 2) {
      console.error(
        `No method for parsing ArrayBuffer to ${bytesPerVoxel}-byte array`
      );
      return;
    }

    const typedArray = bytesPerVoxel === 1 ? Uint8Array : Uint16Array;
    const maskArrayBuffer = new typedArray(data);

    const model = this.currentModel;
    let valueMap = [0];
    if (model.type === MONAI_MODEL_TYPES.DEEPGROW) {
      // Skip value map generated based on the model metadata
      valueMap.push(activeSegmentIndex);
    } else {
      const modelLabels = this.appLabels[model.name];
      valueMap = modelLabels.valueMap;
    }
    const fixedMaskImage = Uint16Array.from(
      maskArrayBuffer,
      value => valueMap[value]
    );
    // const fixedMaskImage = maskArrayBuffer;

    const segIndices = [...new Set(fixedMaskImage)].filter(
      value => value !== 0
    );
    const allLabels = this.appLabels.allLabels;
    const matchingLabels = [];
    if (model.type === MONAI_MODEL_TYPES.DEEPGROW) {
      // Skip labels provided by the model metadata
      segIndices.forEach(value => {
        matchingLabels.push({ label: undefined, value });
      });
    } else {
      segIndices.forEach(value => {
        matchingLabels.push({ label: allLabels[value], value });
      });
    }

    return { maskArray: fixedMaskImage, size, matchingLabels, segIndices };
  }

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
        data: new Blob([niftiBuffer], { type: 'application/octet-stream' }),
        name: 'image.nii.gz',
      };
    } else {
      volumeBuffer = await createDicomVolume(imageIds);
    }

    const response = await this.api.createSession(
      volumeBuffer,
      null,
      SESSION_EXPIRY
    );

    if (response.status === 200) {
      const { session_id } = response.data;
      this._setCookie(`${SESSION_ID_PREFIX}${SeriesInstanceUID}`, session_id);
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

  _getCookie = name => {
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
