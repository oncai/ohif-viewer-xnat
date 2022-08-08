import { LengthTool } from 'cornerstone-tools';
import XNATToolTypes from '../xnatToolTypes';

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
      configuration: {
        drawHandles: true,
        drawHandlesOnHover: false,
        hideHandlesIfMoving: false,
        renderDashed: false,
        digits: 2,
      },
    };

    const initialProps = Object.assign(defaultProps, props);
    super(initialProps);
  }
}
