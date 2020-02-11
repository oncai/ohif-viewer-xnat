import cornerstoneTools from 'cornerstone-tools';
import generateSegmentationMetadata from '../../utils/generateSegmentationMetadata.js';
import TOOL_NAMES from '../../toolNames';

const { BrushTool } = cornerstoneTools;
const segmentationModule = cornerstoneTools.getModule('segmentation');

export default class Brush3DTool extends BrushTool {
  constructor(props = {}) {
    const defaultProps = {
      name: TOOL_NAMES.BRUSH_3D_TOOL,
    };
    const initialProps = Object.assign(defaultProps, props);

    super(initialProps);
  }

  /**
   * Initialise painting with baseBrushTool
   *
   * @override @protected
   * @event
   * @param {Object} evt - The event.
   */
  _startPainting(evt) {
    const eventData = evt.detail;
    const element = eventData.element;
    const { configuration, getters } = segmentationModule;

    const {
      labelmap2D,
      labelmap3D,
      currentImageIdIndex,
      activeLabelmapIndex,
    } = getters.labelmap2D(element);

    const shouldErase =
      this._isCtrlDown(eventData) || this.configuration.alwaysEraseOnClick;

    this.paintEventData = {
      labelmap2D,
      labelmap3D,
      currentImageIdIndex,
      activeLabelmapIndex,
      shouldErase,
    };

    if (configuration.storeHistory) {
      const previousPixelData = labelmap2D.pixelData.slice();

      this.paintEventData.previousPixelData = previousPixelData;
    }

    const segmentIndex = labelmap3D.activeSegmentIndex;
    let metadata = labelmap3D.metadata[segmentIndex];

    if (!metadata) {
      metadata = generateSegmentationMetadata('Unnamed Segment');

      segmentationModule.setters.metadata(
        element,
        activeLabelmapIndex,
        segmentIndex,
        metadata
      );
    }
  }
}
