import cornerstone from 'cornerstone-core';
import { EllipticalRoiTool, importInternal } from 'cornerstone-tools';
import XNATToolTypes from '../XNATToolTypes';
import {
  preMouseDownCallback,
  preventPropagation,
  mouseMoveCallback,
  pointInEllipse,
} from '../utils';

const getHandleNearImagePoint = importInternal(
  'manipulators/getHandleNearImagePoint'
);

/**
 * @public
 * @class XNATEllipticalRoiTool
 * @memberof Tools.Annotation
 * @extends Tools.EllipticalRoiTool
 */
export default class XNATEllipticalRoiTool extends EllipticalRoiTool {
  constructor(props = {}) {
    const defaultProps = {
      name: XNATToolTypes.ELLIPTICAL_ROI,
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

    const handleNearImagePoint = getHandleNearImagePoint(
      element,
      data.handles,
      coords,
      6
    );

    if (handleNearImagePoint) {
      return true;
    }

    const distance = interactionType === 'mouse' ? 15 : 25;
    const startCanvas = cornerstone.pixelToCanvas(element, data.handles.start);
    const endCanvas = cornerstone.pixelToCanvas(element, data.handles.end);

    const minorEllipse = {
      left: Math.min(startCanvas.x, endCanvas.x) + distance / 2,
      top: Math.min(startCanvas.y, endCanvas.y) + distance / 2,
      width: Math.abs(startCanvas.x - endCanvas.x) - distance,
      height: Math.abs(startCanvas.y - endCanvas.y) - distance,
    };

    const majorEllipse = {
      left: Math.min(startCanvas.x, endCanvas.x) - distance / 2,
      top: Math.min(startCanvas.y, endCanvas.y) - distance / 2,
      width: Math.abs(startCanvas.x - endCanvas.x) + distance,
      height: Math.abs(startCanvas.y - endCanvas.y) + distance,
    };

    const pointInMinorEllipse = pointInEllipse(minorEllipse, coords);
    const pointInMajorEllipse = pointInEllipse(majorEllipse, coords);

    if (pointInMajorEllipse && !pointInMinorEllipse) {
      return true;
    }

    return false;
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
