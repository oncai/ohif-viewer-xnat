import csTools from 'cornerstone-tools';
import showNotification from '../../components/common/showNotification.js';
import AIAA_MODEL_TYPES from '../modelTypes';
import cornerstone from 'cornerstone-core';
import addLabelmap2D from 'cornerstone-tools/src/store/modules/segmentationModule/addLabelmap2D';
import cornerstoneTools from 'cornerstone-tools';

const { ProbeTool, getToolState } = csTools;
const triggerEvent = csTools.importInternal('util/triggerEvent');
const draw = csTools.importInternal('drawing/draw');
const drawHandles = csTools.importInternal('drawing/drawHandles');
const getNewContext = csTools.importInternal('drawing/getNewContext');

const modules = csTools.store.modules;
const segmentationModule = csTools.getModule('segmentation');

export default class AIAAProbeTool extends ProbeTool {
  constructor(props = {}) {
    const defaultProps = {
      name: 'AIAAProbeTool',
      supportedInteractionTypes: ['Mouse'],
      configuration: {
        drawHandles: true,
        handleRadius: 2,
        eventName: 'nvidiaaiaaprobeevent',
        color: ['yellow', 'blue'],
      },
    };

    const initialProps = Object.assign(defaultProps, props);
    super(initialProps);

    this._aiaaModule = modules.aiaa;
  }

  preMouseDownCallback(evt) {
    let isActive = false;

    if (!this._aiaaModule.state.menuIsOpen) {
      showNotification(
        'Masks Panel needs to be active to use AIAA tools',
        'warning',
        'NVIDIA AIAA'
      );
    } else if (!this._aiaaModule.client.isConnected) {
      showNotification(
        'Not connected to AIAA Server',
        'warning',
        'NVIDIA AIAA'
      );
    } else if (this._aiaaModule.client.currentTool.type
      === AIAA_MODEL_TYPES.SEGMENTATION) {
      // Ignore adding points for the segmentation tool
    } else if (this._aiaaModule.client.currentModel === null) {
      // Ignore adding points for tools with no models
    } else {
      const labelmaps3D = segmentationModule.getters.labelmaps3D(
        evt.detail.element
      );
      if (!labelmaps3D.labelmaps3D || !labelmaps3D.labelmaps3D[0].activeSegmentIndex) {
        showNotification(
          'Mask collection has no segments, please add a label first',
          'warning',
          'NVIDIA AIAA'
        );
      } else {
        isActive = true;
      }
    }

    if (!isActive) {
      this._preventPropagation(evt);
    }

    return isActive;
  }

  createNewMeasurement(eventData) {
    let res = super.createNewMeasurement(eventData);
    if (res) {
      const labelmap3D = segmentationModule.getters.labelmap3D(
        eventData.element, 0
      );
      const { activeSegmentIndex, metadata } = labelmap3D;

      const toolType = this._aiaaModule.client.currentTool.type;
      const config = this._aiaaModule.configuration;
      const colors = toolType !== AIAA_MODEL_TYPES.DEEPGROW ?
        config.annotationPointColors : config.deepgrowPointColors;

      res.segmentUid = metadata[activeSegmentIndex].uid;
      res.toolType = toolType;
      res.uuid = res.uuid || this._uuidv4();
      res.ctrlKey = toolType !== AIAA_MODEL_TYPES.DEEPGROW ?
        false : eventData.event.ctrlKey;
      res.color = colors[res.ctrlKey ? 1 : 0];
      res.imageId = eventData.image.imageId;
      res.x = eventData.currentPoints.image.x;
      res.y = eventData.currentPoints.image.y;

      // Add point to toolstate
      // const stackToolState = csTools.getToolState(element, 'stack');
      // const imageIds = stackToolState.data[0].imageIds;

      triggerEvent(eventData.element, this.configuration.eventName, res);
    }

    return res;
  }

  renderToolData(evt) {
    const eventData = evt.detail;
    const { handleRadius } = this.configuration;

    const toolData = getToolState(evt.currentTarget, this.name);
    if (!toolData) {
      return;
    }

    const labelmap3D = segmentationModule.getters.labelmap3D(
      eventData.element, 0
    );
    const { activeSegmentIndex, metadata } = labelmap3D;
    const segUid = metadata[activeSegmentIndex].uid;

    const context = getNewContext(eventData.canvasContext.canvas);
    for (let i = 0; i < toolData.data.length; i++) {
      const data = toolData.data[i];
      if (data.segmentUid !== segUid) {
        continue;
      }
      if (data.toolType !== this._aiaaModule.client.currentTool.type) {
        continue;
      }

      // if (data.imageId !== eventData.image.imageId) {
      //   continue;
      // }
      // if (data.visible === false) {
      //   continue;
      // }

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

  _preventPropagation(evt) {
    evt.stopImmediatePropagation();
    evt.stopPropagation();
    evt.preventDefault();
  }
}