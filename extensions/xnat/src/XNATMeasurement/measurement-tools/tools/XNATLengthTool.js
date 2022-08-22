import { LengthTool } from 'cornerstone-tools';
import XNATToolTypes from '../XNATToolTypes';

/**
 * @public
 * @class XNATLengthTool
 * @memberof Tools.Annotation
 * @classdesc Tool for measuring distances.
 * @extends Tools.LengthTool
 */
export default class XNATLengthTool extends LengthTool {
  constructor(props = {}) {
    const defaultProps = {
      name: XNATToolTypes.LENGTH,
    };

    const initialProps = Object.assign(defaultProps, props);
    super(initialProps);
  }
}
