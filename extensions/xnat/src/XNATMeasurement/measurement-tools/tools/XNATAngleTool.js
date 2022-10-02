import { AngleTool, importInternal } from 'cornerstone-tools';
import XNATToolTypes from '../XNATToolTypes';
import {
  preMouseDownCallback,
  preventPropagation,
  mouseMoveCallback,
} from '../utils';

const lineSegDistance = importInternal('util/lineSegDistance');

/**
 * @public
 * @class XNATAngleTool
 * @memberof Tools.Annotation
 * @extends Tools.AngleTool
 */
export default class XNATAngleTool extends AngleTool {
  constructor(props = {}) {
    const defaultProps = {
      name: XNATToolTypes.ANGLE,
    };

    const initialProps = Object.assign(defaultProps, props);
    super(initialProps);

    this.preMouseDownCallback = preMouseDownCallback.bind(this);
    this.mouseMoveCallback = mouseMoveCallback.bind(this);
  }

  pointNearTool(element, data, coords, interactionType = 'mouse') {
    const hasRequiredHandles =
      data &&
      data.handles &&
      data.handles.start &&
      data.handles.end &&
      data.handles.handles;

    if (!hasRequiredHandles) {
      console.warn(
        `invalid parameters supplied to tool ${this.name}'s pointNearTool`
      );

      return false;
    }

    const threshold = interactionType === 'mouse' ? 15 : 25;

    return (
      lineSegDistance(
        element,
        data.handles.start,
        data.handles.middle,
        coords
      ) < threshold ||
      lineSegDistance(element, data.handles.middle, data.handles.end, coords) <
        threshold
    );
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
}
