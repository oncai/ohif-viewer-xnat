import csTools from 'cornerstone-tools';
import TOOL_NAMES from '../../toolNames';
import triggerSegmentGenerationEvent from './triggerSegmentGenerationEvent';

const { CircleScissorsTool } = csTools;

export default class XNATCircleScissorsTool extends CircleScissorsTool {
  constructor(props = {}) {
    const defaultProps = {
      name: TOOL_NAMES.XNAT_CIRCLE_SCISSORS_TOOL,
    };

    const initialProps = Object.assign(defaultProps, props);
    super(initialProps);
  }

  preMouseDownCallback(evt) {
    const { detail } = evt;
    triggerSegmentGenerationEvent(detail.element);
  }

  preTouchStartCallback(evt) {
    this.preMouseDownCallback(evt);
  }

  applyActiveStrategy(evt, operationData) {
    if (evt.detail.event.ctrlKey) {
      return this.strategies['ERASE_INSIDE'].call(this, evt, operationData);
    }
    return this.strategies[this.activeStrategy].call(this, evt, operationData);
  }
}
