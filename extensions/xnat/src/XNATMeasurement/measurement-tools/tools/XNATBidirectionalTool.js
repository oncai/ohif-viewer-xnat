import { BidirectionalTool } from 'cornerstone-tools';
import XNATToolTypes from '../XNATToolTypes';

/**
 * @public
 * @class XNATBidirectionalTool
 * @memberof Tools.Annotation
 * @extends Tools.BidirectionalTool
 */
export default class XNATBidirectionalTool extends BidirectionalTool {
  constructor(props = {}) {
    const defaultProps = {
      name: XNATToolTypes.BIDIRECTIONAL,
    };

    const initialProps = Object.assign(defaultProps, props);
    super(initialProps);
  }
}
