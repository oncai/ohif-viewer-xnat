import csTools from 'cornerstone-tools';
import showNotification from '../../../components/common/showNotification.js';
import { MONAI_MODEL_TYPES } from '../../api';
import { generateSegmentationMetadata } from '../../../peppermint-tools';

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
        color: ['yellow', 'blue'],
      },
    };

    const initialProps = Object.assign(defaultProps, props);
    super(initialProps);

    this._monaiModule = modules.monai;
  }

  preMouseDownCallback(evt) {
    let isActive = false;
    const toolType = this._monaiModule.client.currentTool.type;

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
    } else if (toolType.startsWith('segmentation')) {
      // Ignore adding points for the segmentation tool
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
      const toolType = this._monaiModule.client.currentTool.type;
      const config = this._monaiModule.configuration;
      const colors =
        toolType !== MONAI_MODEL_TYPES.DEEPGROW
          ? config.annotationPointColors
          : config.deepgrowPointColors;

      const { segmentUid, currentImageIdIndex } = this._getSegmentData(
        eventData.element
      );

      res.segmentUid = segmentUid;
      res.toolType = toolType;
      res.uuid = res.uuid || this._uuidv4();
      res.ctrlKey = eventData.event.ctrlKey;
      res.color = colors[res.ctrlKey ? 1 : 0];
      res.imageId = eventData.image.imageId;
      res.x = eventData.currentPoints.image.x;
      res.y = eventData.currentPoints.image.y;
      res.z = currentImageIdIndex;

      // Add point to the tool's module state
      const pointData = {
        x: res.x,
        y: res.y,
        z: res.z,
        imageId: res.imageId,
        background: res.ctrlKey,
        toolType: toolType,
        uuid: res.uuid,
      };

      this._monaiModule.setters.point(res.segmentUid, pointData);

      if (!eventData.event.altKey) {
        triggerEvent(eventData.element, this.configuration.eventName, res);
      }
    }

    return res;
  }

  renderToolData(evt) {
    const eventData = evt.detail;
    const { handleRadius } = this.configuration;

    const toolData = getToolState(evt.currentTarget, this.name);
    if (!toolData || !toolData.data || !toolData.data.length) {
      return;
    }

    const labelmap3D = segmentationModule.getters.labelmap3D(
      eventData.element,
      0
    );
    const { activeSegmentIndex, metadata } = labelmap3D;
    if (metadata[activeSegmentIndex] === undefined) {
      return;
    }
    const segUid = metadata[activeSegmentIndex].uid;

    const context = getNewContext(eventData.canvasContext.canvas);
    for (let i = 0; i < toolData.data.length; i++) {
      const data = toolData.data[i];
      if (data.segmentUid !== segUid) {
        continue;
      }
      if (data.toolType !== this._monaiModule.client.currentTool.type) {
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
      activeLabelmapIndex,
    } = segmentationModule.getters.labelmap2D(element);

    let segmentIndex = labelmap3D.activeSegmentIndex;
    let metadata = labelmap3D.metadata[segmentIndex];

    if (!metadata) {
      let label = 'Unnamed Segment';
      const modelLabels = this._monaiModule.client.currentModel.labels;
      if (modelLabels.length > 0) {
        label = modelLabels[0];
      }
      metadata = generateSegmentationMetadata(label);

      segmentIndex = labelmap3D.activeSegmentIndex = 1;

      segmentationModule.setters.metadata(
        element,
        activeLabelmapIndex,
        segmentIndex,
        metadata
      );

      triggerEvent(element, 'peppermintautosegmentgenerationevent', {});
    }

    return {
      segmentUid: metadata.uid,
      currentImageIdIndex,
    };
  }

  _preventPropagation(evt) {
    evt.stopImmediatePropagation();
    evt.stopPropagation();
    evt.preventDefault();
  }
}
