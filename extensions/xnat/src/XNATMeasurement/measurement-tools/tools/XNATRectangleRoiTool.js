import { RectangleRoiTool } from 'cornerstone-tools';
import XNATToolTypes from '../XNATToolTypes';

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
  }
}
