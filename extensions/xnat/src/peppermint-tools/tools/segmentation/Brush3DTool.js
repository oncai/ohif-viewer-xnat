import cornerstoneTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';
import TOOL_NAMES from '../../toolNames';
import triggerSegmentGenerationEvent from './triggerSegmentGenerationEvent';
import triggerSegmentCompletedEvent from './triggerSegmentCompletedEvent';

const { BrushTool } = cornerstoneTools;
const { getCircle, drawBrushPixels } = cornerstoneTools.importInternal(
  'util/segmentationUtils'
);
const segmentationModule = cornerstoneTools.getModule('segmentation');

export default class Brush3DTool extends BrushTool {
  constructor(props = {}) {
    const defaultProps = {
      name: TOOL_NAMES.BRUSH_3D_TOOL,
    };
    const initialProps = Object.assign(defaultProps, props);

    super(initialProps);
  }

  preTouchStartCallback(evt) {
    this._startPainting(evt);

    return true;
  }

  touchEndCallback(evt) {
    this._endPainting(evt);
  }

  _endPainting(evt) {
    super._endPainting(evt);

    const eventData = evt.detail;
    triggerSegmentCompletedEvent(eventData.element, this.name);
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

    triggerSegmentGenerationEvent(element);
  }

  /**
   * Paints the data to the labelmap.
   *
   * @protected
   * @param  {Object} evt The data object associated with the event.
   * @returns {void}
   */
  _paint(evt) {
    const { configuration } = segmentationModule;
    const eventData = evt.detail;
    const element = eventData.element;
    const { rows, columns } = eventData.image;
    const { x, y } = eventData.currentPoints.image;

    if (x < 0 || x > columns || y < 0 || y > rows) {
      return;
    }

    const radius = configuration.radius;
    const pointerArray = getCircle(radius, rows, columns, x, y);

    const { labelmap2D, labelmap3D, shouldErase } = this.paintEventData;

    // Draw / Erase the active color.
    drawBrushPixels(
      pointerArray,
      labelmap2D.pixelData,
      labelmap3D.activeSegmentIndex,
      columns,
      shouldErase
    );

    if (labelmap3D.isFractional) {
      this._setProbabilityOfFractionalTo100(pointerArray, rows, columns);
    }

    cornerstone.updateImage(evt.detail.element);
  }

  _setProbabilityOfFractionalTo100(pointerArray, rows, columns) {
    const {
      currentImageIdIndex,
      labelmap3D,
      shouldErase,
    } = this.paintEventData;

    const value = shouldErase ? 0 : 255;

    const { probabilityBuffer } = labelmap3D;

    const sliceLength = rows * columns;
    const byteOffset = sliceLength * currentImageIdIndex;

    const uInt8ProbabilityBufferView = new Uint8Array(
      probabilityBuffer,
      byteOffset,
      sliceLength
    );

    pointerArray.forEach(point => {
      const pixelIndex = point[0] + point[1] * columns;

      uInt8ProbabilityBufferView[pixelIndex] = value;
    });
  }
}
