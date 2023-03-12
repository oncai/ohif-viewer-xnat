import csTools from 'cornerstone-tools';
import TOOL_NAMES from '../../toolNames';
import triggerSegmentGenerationEvent from './triggerSegmentGenerationEvent';
import triggerSegmentCompletedEvent from './triggerSegmentCompletedEvent';

const { FreehandScissorsTool } = csTools;

export default class XNATFreehandScissorsTool extends FreehandScissorsTool {
  constructor(props = {}) {
    const defaultProps = {
      name: TOOL_NAMES.XNAT_FREEHAND_SCISSORS_TOOL,
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

    const { event } = detail;
    if (event.ctrlKey) {
      this.activeStrategy = 'ERASE_INSIDE';
    } else {
      this.activeStrategy = 'FILL_INSIDE';
    }
  }

  preTouchStartCallback(evt) {
    const { detail } = evt;
    triggerSegmentGenerationEvent(detail.element);
  }
}
