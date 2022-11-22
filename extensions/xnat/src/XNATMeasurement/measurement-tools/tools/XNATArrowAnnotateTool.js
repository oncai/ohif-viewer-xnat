import { ArrowAnnotateTool, importInternal } from 'cornerstone-tools';
import XNATToolTypes from '../XNATToolTypes';
import {
  preMouseDownCallback,
  preventPropagation,
  mouseMoveCallback,
} from '../utils';

const lineSegDistance = importInternal('util/lineSegDistance');

/**
 * @public
 * @class XNATArrowAnnotateTool
 * @memberof Tools.Annotation
 * @extends Tools.ArrowAnnotateTool
 */
export default class XNATArrowAnnotateTool extends ArrowAnnotateTool {
  constructor(props = {}) {
    const defaultProps = {
      name: XNATToolTypes.ARROW_ANNOTATE,
    };

    const initialProps = Object.assign(defaultProps, props);
    super(initialProps);

    this.preMouseDownCallback = preMouseDownCallback.bind(this);
    this.mouseMoveCallback = mouseMoveCallback.bind(this);

    this.configuration.getTextCallback = this._getTextCallback.bind(this);
  }

  pointNearTool(element, data, coords, interactionType = 'mouse') {
    const hasStartAndEndHandles =
      data && data.handles && data.handles.start && data.handles.end;

    if (!hasStartAndEndHandles) {
      console.warn(
        `invalid parameters supplied to tool ${this.name}'s pointNearTool`
      );

      return false;
    }

    const disctance = lineSegDistance(
      element,
      data.handles.start,
      data.handles.end,
      coords
    );

    const threshold = interactionType === 'mouse' ? 15 : 25;

    return disctance < threshold;
  }

  handleSelectedCallback(evt, toolData, handle, interactionType = 'mouse') {
    if (!toolData.visible || toolData.locked) {
      preventPropagation(evt);
      return;
    }

    super.handleSelectedCallback(evt, toolData, handle, interactionType);
  }

  toolSelectedCallback(evt, toolData, interactionType = 'mouse') {
    if (!toolData.visible || toolData.locked) {
      preventPropagation(evt);
      return;
    }

    super.toolSelectedCallback(evt, toolData, interactionType);
  }

  _getTextCallback(callback, eventDetails) {
    // Handled by XNATMeasurementAPI
    callback('Unnamed measurement');
  }

  doubleClickCallback(evt) {
    // Ignore
    return true;
  }
}
