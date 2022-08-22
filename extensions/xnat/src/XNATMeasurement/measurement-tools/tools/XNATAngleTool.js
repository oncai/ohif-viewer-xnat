import { AngleTool } from 'cornerstone-tools';
import XNATToolTypes from '../XNATToolTypes';

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
  }
}
