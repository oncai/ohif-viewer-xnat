import csTools from 'cornerstone-tools';
import TOOL_NAMES from '../../toolNames';
import triggerSegmentGenerationEvent from './triggerSegmentGenerationEvent';
import triggerSegmentCompletedEvent from './triggerSegmentCompletedEvent';

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
    const { detail } = evt;

    triggerSegmentGenerationEvent(detail.element);

    const { event } = detail;
    if (event.ctrlKey) {
      this.activeStrategy = 'ERASE_INSIDE';
    } else {
      this.activeStrategy = 'FILL_INSIDE';
    }

    super.preMouseDownCallback(evt);
  }

  preTouchStartCallback(evt) {
    const { detail } = evt;

    this._startPainting(evt);

    triggerSegmentGenerationEvent(detail.element);
  }

  touchEndCallback(evt) {
    this._endPainting(evt);
  }

  _endPainting(evt) {
    super._endPainting(evt);

    const eventData = evt.detail;
    triggerSegmentCompletedEvent(eventData.element);
  }
}
