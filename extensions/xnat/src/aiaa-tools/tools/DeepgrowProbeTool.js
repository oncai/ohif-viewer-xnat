import AIAAProbeToolBase from './AIAAProbeToolBase.js';
import TOOL_NAMES from '../toolNames.js';

export default class DeepgrowProbeTool extends AIAAProbeToolBase {
  constructor(props = {}) {
    const defaultProps = {
      name: TOOL_NAMES.DEEPGROW_PROB_TOOL,
      supportedInteractionTypes: ['Mouse'],
      configuration: {
        drawHandles: true,
        handleRadius: 2,
        eventName: 'nvidia_aiaa_event_DeepgrowProbe',
        color: ['red', 'blue'],
      },
    };

    const initialProps = Object.assign(defaultProps, props);
    super(initialProps);
  }
}