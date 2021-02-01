import csTools from 'cornerstone-tools';
import TOOL_NAMES from '../../toolNames';
import preMouseDownCallback from './preMouseDownCallback';

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
    preMouseDownCallback(evt.detail.element);
    // super.preMouseDownCallback(evt);
  }
}
