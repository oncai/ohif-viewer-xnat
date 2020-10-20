import AIAAProbeToolBase from './AIAAProbeToolBase.js';
import TOOL_NAMES from '../toolNames.js';

export default class DExtr3DProbeTool extends AIAAProbeToolBase {
  constructor(props = {}) {
    const defaultProps = {
      name: TOOL_NAMES.DEXTR3D_PROB_TOOL,
      supportedInteractionTypes: ['Mouse'],
      configuration: {
        drawHandles: true,
        handleRadius: 2,
        eventName: 'nvidia_aiaa_event_DExtr3DProbe',
        color: ['yellow', 'yellow'],
      },
    };

    const initialProps = Object.assign(defaultProps, props);
    super(initialProps);
  }
}