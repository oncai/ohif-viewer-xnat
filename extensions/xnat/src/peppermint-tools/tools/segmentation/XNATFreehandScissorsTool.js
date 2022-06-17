import csTools from 'cornerstone-tools';
import TOOL_NAMES from '../../toolNames';
import triggerSegmentGenerationEvent from './triggerSegmentGenerationEvent';

const { FreehandScissorsTool } = csTools;

export default class XNATFreehandScissorsTool extends FreehandScissorsTool {
  constructor(props = {}) {
    const defaultProps = {
      name: TOOL_NAMES.XNAT_FREEHAND_SCISSORS_TOOL,
    };

    const initialProps = Object.assign(defaultProps, props);
    super(initialProps);
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
