import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import showNotification from '../../../components/common/showNotification.js';
import { MONAI_MODEL_TYPES } from '../../api';

const { ProbeTool, getToolState } = csTools;
const triggerEvent = csTools.importInternal('util/triggerEvent');
const draw = csTools.importInternal('drawing/draw');
const drawHandles = csTools.importInternal('drawing/drawHandles');
const getNewContext = csTools.importInternal('drawing/getNewContext');

const modules = csTools.store.modules;
const segmentationModule = csTools.getModule('segmentation');

export default class MONAIProbeTool extends ProbeTool {
  constructor(props = {}) {
    const defaultProps = {
      name: 'MONAILabelProbeTool',
      supportedInteractionTypes: ['Mouse'],
      configuration: {
        drawHandles: true,
        handleRadius: 2,
        eventName: 'monaiprobeevent',
        color: ['yellow', 'red'],
      },
    };

    const initialProps = Object.assign(defaultProps, props);
    super(initialProps);

    this._monaiModule = modules.monai;
  }

  preMouseDownCallback(evt) {
    const eventData = evt.detail;
    let isActive = false;
    const toolType = this._monaiModule.client.currentTool.type;
    const segmentData = this._getSegmentData(eventData.element);
    eventData.segmentData = segmentData;

    if (!this._monaiModule.state.menuIsOpen) {
      showNotification(
        'Masks Panel needs to be active to use MONAILabel tools',
        'warning',
        'MONAILabel'
      );
    } else if (!this._monaiModule.client.isConnected) {
      showNotification(
        'Not connected to MONAILabel Server',
        'warning',
        'MONAILabel'
      );
    } else if (toolType === MONAI_MODEL_TYPES.SCRIBBLES) {
      showNotification(
        'Scribbles tool is not currently supported',
        'warning',
        'MONAILabel'
      );
    } else if (toolType === MONAI_MODEL_TYPES.SEGMENTATION) {
      showNotification(
        'No points are required, select a segmentation model and then click Run',
        'warning',
        'MONAILabel'
      );
    } else if (toolType === MONAI_MODEL_TYPES.DEEPGROW) {
      if (!segmentData.segmentUid) {
        showNotification(
          'An active segment should be created/selected to run this model',
          'warning',
          'MONAILabel'
        );
      } else {
        isActive = true;
      }
    } else if (this._monaiModule.client.currentModel === null) {
      // Ignore adding points for tools with no models
    } else {
      isActive = true;
    }

    if (!isActive) {
      this._preventPropagation(evt);
    }

    return isActive;
  }

  createNewMeasurement(eventData) {
    let res = super.createNewMeasurement(eventData);
    if (res) {
      const colors = this.configuration.color;

      const { image, currentPoints, event } = eventData;
      const { segmentUid, currentImageIdIndex } = eventData.segmentData;
      const imageId = image.imageId;
      const { SeriesInstanceUID } = cornerstone.metaData.get(
        'instance',
        imageId
      );

      const model = this._monaiModule.client.currentModel;
      const {
        name: modelName,
        type: modelType,
        dimension: modelDimension,
      } = model;
      let pointCollectionId = `${SeriesInstanceUID}_${modelName}`;
      if (modelType === MONAI_MODEL_TYPES.DEEPGROW) {
        pointCollectionId += `_${segmentUid}`;
      }

      res.segmentUid = segmentUid;
      res.modelType = modelType;
      res.modelName = modelType;
      res.modelDimension = modelDimension;
      res.uuid = res.uuid || this._uuidv4();
      res.ctrlKey = event.ctrlKey;
      res.color = colors[res.ctrlKey ? 1 : 0];
      res.imageId = imageId;
      res.x = currentPoints.image.x;
      res.y = currentPoints.image.y;
      res.z = currentImageIdIndex;
      res.pointCollectionId = pointCollectionId;

      // Add point to the tool's module state
      const pointData = {
        x: res.x,
        y: res.y,
        z: res.z,
        imageId: res.imageId,
        background: res.ctrlKey,
        uuid: res.uuid,
        pointCollectionId,
      };

      this._monaiModule.setters.point(pointCollectionId, pointData);

      if (!eventData.event.altKey) {
        triggerEvent(eventData.element, this.configuration.eventName, res);
      }
    }

    return res;
  }

  renderToolData(evt) {
    const eventData = evt.detail;

    const toolData = getToolState(evt.currentTarget, this.name);
    if (!toolData || !toolData.data || !toolData.data.length) {
      return;
    }

    const { image, element } = eventData;
    const pointCollectionId = this._getPointCollectionId(
      image.imageId,
      element
    );
    const points = this._monaiModule.getters.points(pointCollectionId);

    if (!points) {
      return;
    }

    const { handleRadius } = this.configuration;
    const context = getNewContext(eventData.canvasContext.canvas);

    for (let i = 0; i < toolData.data.length; i++) {
      const data = toolData.data[i];
      if (data.pointCollectionId !== pointCollectionId) {
        continue;
      }

      draw(context, context => {
        const color = data.color;
        drawHandles(context, eventData, data.handles, {
          handleRadius,
          color,
        });
      });
    }
  }

  _uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      let r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8;

      return v.toString(16);
    });
  }

  _getSegmentData(element) {
    const {
      labelmap3D,
      currentImageIdIndex,
    } = segmentationModule.getters.labelmap2D(element);

    let segmentIndex = labelmap3D.activeSegmentIndex;
    let metadata = labelmap3D.metadata[segmentIndex];

    return {
      segmentUid: metadata && metadata.uid ? metadata.uid : undefined,
      currentImageIdIndex,
    };
  }

  _preventPropagation(evt) {
    evt.stopImmediatePropagation();
    evt.stopPropagation();
    evt.preventDefault();
  }

  _getPointCollectionId(imageId, element) {
    const { SeriesInstanceUID } = cornerstone.metaData.get('instance', imageId);
    const model = this._monaiModule.client.currentModel;
    const { name: modelName, type: modelType } = model;

    let pointCollectionId = `${SeriesInstanceUID}_${modelName}`;
    if (modelType === MONAI_MODEL_TYPES.DEEPGROW) {
      const { segmentUid } = this._getSegmentData(element);
      pointCollectionId += `_${segmentUid}`;
    }

    return pointCollectionId;
  }
}
