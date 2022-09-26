import cornerstone from 'cornerstone-core';
import cornerstoneMath from 'cornerstone-math';
import { RectangleRoiTool } from 'cornerstone-tools';
import XNATToolTypes from '../XNATToolTypes';
import {
  preMouseDownCallback,
  preventPropagation,
  mouseMoveCallback,
} from '../utils';

/**
 * @public
 * @class XNATRectangleRoiTool
 * @memberof Tools.Annotation
 * @extends Tools.RectangleRoiTool
 */
export default class XNATRectangleRoiTool extends RectangleRoiTool {
  constructor(props = {}) {
    const defaultProps = {
      name: XNATToolTypes.RECTANGLE_ROI,
    };

    const initialProps = Object.assign(defaultProps, props);
    super(initialProps);

    this.preMouseDownCallback = preMouseDownCallback.bind(this);
    this.mouseMoveCallback = mouseMoveCallback.bind(this);
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

    const distance = interactionType === 'mouse' ? 15 : 25;
    const startCanvas = cornerstone.pixelToCanvas(element, data.handles.start);
    const endCanvas = cornerstone.pixelToCanvas(element, data.handles.end);

    const rect = {
      left: Math.min(startCanvas.x, endCanvas.x),
      top: Math.min(startCanvas.y, endCanvas.y),
      width: Math.abs(startCanvas.x - endCanvas.x),
      height: Math.abs(startCanvas.y - endCanvas.y),
    };

    const distanceToPoint = cornerstoneMath.rect.distanceToPoint(rect, coords);

    return distanceToPoint < distance;
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
