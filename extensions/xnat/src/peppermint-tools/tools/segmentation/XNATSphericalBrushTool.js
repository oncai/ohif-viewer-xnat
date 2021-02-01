import csTools from 'cornerstone-tools';
import TOOL_NAMES from '../../toolNames';
import preMouseDownCallback from './preMouseDownCallback';

const { SphericalBrushTool } = csTools;

export default class XNATSphericalBrushTool extends SphericalBrushTool {
  constructor(props = {}) {
    const defaultProps = {
      name: TOOL_NAMES.XNAT_SPHERICAL_BRUSH_TOOL,
    };

    const initialProps = Object.assign(defaultProps, props);
    super(initialProps);
  }

  preMouseDownCallback(evt) {
    preMouseDownCallback(evt.detail.element);
    super.preMouseDownCallback(evt);
  }
}
