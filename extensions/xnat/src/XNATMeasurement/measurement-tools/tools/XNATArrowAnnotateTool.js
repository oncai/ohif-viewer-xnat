import { ArrowAnnotateTool } from 'cornerstone-tools';
import XNATToolTypes from '../XNATToolTypes';

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
  }
}
