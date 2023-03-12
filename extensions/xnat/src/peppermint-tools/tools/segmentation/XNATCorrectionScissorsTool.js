import csTools from 'cornerstone-tools';
import TOOL_NAMES from '../../toolNames';
import triggerSegmentGenerationEvent from './triggerSegmentGenerationEvent';
import triggerSegmentCompletedEvent from './triggerSegmentCompletedEvent';

/*
 *  Operation using a modification of the Tobias Heimann Correction Algorithm:
 *  The algorithm is described in full length in Tobias Heimann's diploma thesis (MBI Technical Report 145, p. 37 - 40).
 */

const { CorrectionScissorsTool } = csTools;

export default class XNATCircleScissorsTool extends CorrectionScissorsTool {
  constructor(props = {}) {
    const defaultProps = {
      name: TOOL_NAMES.XNAT_CORRECTION_SCISSORS_TOOL,
    };

    const initialProps = Object.assign(defaultProps, props);
    super(initialProps);

    // Override default mixin callbacks
    this.mouseUpCallback = this.mouseUpOrTouchEndCallback.bind(this);
    this.touchEndCallback = this.mouseUpOrTouchEndCallback.bind(this);
  }

  mouseUpOrTouchEndCallback(evt) {
    this._applyStrategy(evt);
    const eventData = evt.detail;
    triggerSegmentCompletedEvent(eventData.element, this.name);
  }

  preMouseDownCallback(evt) {
    const { detail } = evt;

    triggerSegmentGenerationEvent(detail.element);
  }

  preTouchStartCallback(evt) {
    const { detail } = evt;
    triggerSegmentGenerationEvent(detail.element);
  }
}
