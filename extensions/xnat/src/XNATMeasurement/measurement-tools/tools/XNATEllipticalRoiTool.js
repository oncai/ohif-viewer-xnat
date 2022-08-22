import { EllipticalRoiTool } from 'cornerstone-tools';
import XNATToolTypes from '../XNATToolTypes';

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
  }
}
