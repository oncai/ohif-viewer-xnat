import { getEnabledElement, internal } from 'cornerstone-core';
import {
  FreehandRoiSculptorTool,
  toolColors,
  store,
  getToolState,
  getToolForElement,
  importInternal,
  EVENTS,
} from 'cornerstone-tools';
import { updateImage } from 'cornerstone-core';
import interpolate from '../utils/freehandInterpolate/interpolate.js';
import TOOL_NAMES from '../toolNames';

const drawHandles = importInternal('drawing/drawHandles');
const triggerEvent = importInternal('util/triggerEvent');

const { calculateTransform } = internal;

const { modules, state } = store;

export default class FreehandRoi3DSculptorTool extends FreehandRoiSculptorTool {
  constructor(props = {}) {
    const defaultProps = {
      configuration: getDefaultFreehandSculptorMouseToolConfiguration(),
      referencedToolName: TOOL_NAMES.FREEHAND_ROI_3D_TOOL,
      name: TOOL_NAMES.FREEHAND_ROI_3D_SCULPTOR_TOOL,
    };
    const initialProps = Object.assign(defaultProps, props);

    super(initialProps);

    // Create bound functions for private event loop.
    this.activeMouseUpCallback = this.activeMouseUpCallback.bind(this);
  }

  /**
   * Select the freehand tool to be edited. Don't allow selecting of locked
   * ROIContours.
   *
   * @private
   * @param {Object} eventData - Data object associated with the event.
   */
  _selectFreehandTool(eventData) {
    const config = this.configuration;
    const element = eventData.element;
    const closestToolIndex = this._getClosestFreehandToolOnElement(
      element,
      eventData
    );

    if (closestToolIndex === undefined) {
      return;
    }

    const toolState = getToolState(element, this.referencedToolName);
    const toolData = toolState.data[closestToolIndex];
    const isLocked = toolData.referencedStructureSet.isLocked;

    if (isLocked) {
      return;
    }

    config.hoverColor = toolData.referencedROIContour.color;

    config.currentTool = closestToolIndex;
  }

  /**
   * Event handler for MOUSE_UP during the active loop.
   *
   * @param {Object} evt - The event.
   */
  _activeEnd(evt) {
    const eventData = evt.detail;
    const element = eventData.element;
    const config = this.configuration;

    this._active = false;

    state.isMultiPartToolActive = false;

    this._getMouseLocation(eventData);
    this._invalidateToolData(eventData);

    config.mouseUpRender = true;

    this._deactivateSculpt(element);

    const toolData = getToolState(element, this.referencedToolName);
    const data = toolData.data[config.currentTool];

    if (modules.freehand3D.state.interpolate) {
      interpolate(data, element);
    }

    // Update the image
    updateImage(eventData.element);

    preventPropagation(evt);

    // Fire Completed Event
    const eventType = EVENTS.MEASUREMENT_COMPLETED;
    const completedEventData = {
      toolName: this.name,
      toolType: this.name, // Deprecation notice: toolType will be replaced by toolName
      element,
      measurementData: data,
    };

    triggerEvent(element, eventType, completedEventData);
  }

  /**
   * Invalidate the freehand tool data, tirggering re-calculation of statistics.
   *
   * @private @override
   * @param {Object} eventData - Data object associated with the event.
   */
  _invalidateToolData(eventData) {
    const config = this.configuration;
    const element = eventData.element;
    const toolData = getToolState(element, this.referencedToolName);
    const data = toolData.data[config.currentTool];

    data.invalidated = true;
    data.interpolated = false;
  }

  renderToolData(evt) {
    const eventData = evt.detail;

    if (this.configuration.currentTool === null) {
      return false;
    }

    const element = eventData.element;
    const config = this.configuration;

    const toolState = getToolState(element, this.referencedToolName);
    const data = toolState.data[config.currentTool];

    if (!data) {
      return false;
    }

    if (this._active) {
      const context = eventData.canvasContext.canvas.getContext('2d');
      const options = {
        color: this.configuration.dragColor,
        fill: null,
        handleRadius: this._toolSizeCanvas,
      };

      const coords = this.configuration.mouseLocation.handles.start;
      const fixedCoords = this._fixPixelCoords(coords, evt);

      drawHandles(
        context,
        eventData,
        { start: fixedCoords }, //this.configuration.mouseLocation.handles,
        options
      );
    } else if (this.configuration.showCursorOnHover && !this._recentTouchEnd) {
      this._renderHoverCursor(evt);
    }
  }

  /**
   * Renders the cursor
   *
   * @private
   * @param  {type} evt description
   * @returns {void}
   */
  _renderHoverCursor(evt) {
    const eventData = evt.detail;
    const element = eventData.element;
    const context = eventData.canvasContext.canvas.getContext('2d');

    const toolState = getToolState(element, this.referencedToolName);
    const data = toolState.data[this.configuration.currentTool];

    this._recentTouchEnd = false;

    let coords;

    if (this.configuration.mouseUpRender) {
      coords = this.configuration.mouseLocation.handles.start;
      this.configuration.mouseUpRender = false;
    } else {
      coords = state.mousePositionImage;
    }

    const fixedCoords = this._fixPixelCoords(coords, evt);

    const freehandRoiTool = getToolForElement(element, this.referencedToolName);
    let radiusCanvas = freehandRoiTool.distanceFromPointCanvas(
      element,
      data,
      coords
    );

    this.configuration.mouseLocation.handles.start.x = coords.x;
    this.configuration.mouseLocation.handles.start.y = coords.y;

    if (this.configuration.limitRadiusOutsideRegion) {
      const unlimitedRadius = radiusCanvas;

      radiusCanvas = this._limitCursorRadiusCanvas(eventData, radiusCanvas);

      // Fade if distant
      if (
        unlimitedRadius >
        this.configuration.hoverCursorFadeDistance * radiusCanvas
      ) {
        context.globalAlpha = this.configuration.hoverCursorFadeAlpha;
      }
    }

    const options = {
      fill: null,
      color: this.configuration.hoverColor,
      handleRadius: radiusCanvas,
    };

    drawHandles(
      context,
      eventData,
      { start: fixedCoords }, // this.configuration.mouseLocation.handles,
      options
    );

    if (this.configuration.limitRadiusOutsideRegion) {
      context.globalAlpha = 1.0; // Reset drawing alpha for other draw calls.
    }
  }

  _fixPixelCoords(coords, evt) {
    const eventData = evt.detail;
    const element = eventData.element;
    const enabledElement = getEnabledElement(element);
    const context = enabledElement.canvas.getContext('2d');

    /*
      a: Horizontal scaling
      d: Vertical scaling
      e: Horizontal moving
      f: Vertical moving
    */
    const { a, d, e, f } = context.getTransform();

    // Pixel to canvas
    const transform = calculateTransform(enabledElement);
    const transform_inverted = transform.clone();
    transform_inverted.invert();

    // Fix canvas coordinates
    transform.scale(1 / a, 1 / d);
    transform.translate(-e, -f);

    const canvasCoords = transform.transformPoint(coords.x, coords.y);
    const pixelCoords = transform_inverted.transformPoint(
      canvasCoords.x,
      canvasCoords.y
    );

    return pixelCoords;
  }
}

/**
 * Returns the default freehandSculpterMouseTool configuration.
 *
 * @return {Object} The default configuration object.
 */
function getDefaultFreehandSculptorMouseToolConfiguration() {
  return {
    mouseLocation: {
      handles: {
        start: {
          highlight: true,
          active: true,
        },
      },
    },
    minSpacing: 1,
    currentTool: null,
    dragColor: toolColors.getActiveColor(),
    hoverColor: toolColors.getToolColor(),

    /* --- Hover options ---
    showCursorOnHover:        Shows a preview of the sculpting radius on hover.
    limitRadiusOutsideRegion: Limit max toolsize outside the subject ROI based
                              on subject ROI area.
    hoverCursorFadeAlpha:     Alpha to fade to when tool very distant from
                              subject ROI.
    hoverCursorFadeDistance:  Distance from ROI in which to fade the hoverCursor
                              (in units of radii).
    */
    showCursorOnHover: true,
    limitRadiusOutsideRegion: true,
    hoverCursorFadeAlpha: 0.5,
    hoverCursorFadeDistance: 1.2,
  };
}

function preventPropagation(evt) {
  evt.stopImmediatePropagation();
  evt.stopPropagation();
  evt.preventDefault();
}
