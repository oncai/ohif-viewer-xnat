import { BidirectionalTool } from 'cornerstone-tools';
import XNATToolTypes from '../XNATToolTypes';
import {
  preMouseDownCallback,
  preventPropagation,
  mouseMoveCallback,
} from '../utils';

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

    delete this.handleSelectedCallback;

    this.preMouseDownCallback = preMouseDownCallback.bind(this);
    this.mouseMoveCallback = mouseMoveCallback.bind(this);
  }

  handleSelectedCallback(evt, toolData, handle, interactionType = 'mouse') {
    if (!toolData.visible || toolData.locked) {
      preventPropagation(evt);
      return;
    }

    if (interactionType === 'touch') {
      this.handleSelectedTouchCallback(evt);
    } else {
      this.handleSelectedMouseCallback(evt);
    }
  }

  toolSelectedCallback(evt, toolData, interactionType = 'mouse') {
    if (!toolData.visible || toolData.locked) {
      preventPropagation(evt);
      return;
    }

    super.toolSelectedCallback(evt, toolData, interactionType);
  }
}
