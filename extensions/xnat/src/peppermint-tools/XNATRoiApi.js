import cornerstone from 'cornerstone-core';
import {
  globalImageIdSpecificToolStateManager,
  getToolState,
  getModule,
} from 'cornerstone-tools';
import OHIF from '@ohif/core';
import TOOL_NAMES from './toolNames';
import { XNAT_EVENTS } from '../utils';
import {
  calculateContourArea,
  calculateContourRoiVolume,
  calculateMaskRoiVolume,
  calculateMaskRoi2DStats,
  getRoiMeasurementUnits,
} from './utils';

const { studyMetadataManager } = OHIF.utils;

const globalToolStateManager = globalImageIdSpecificToolStateManager;

const segmentationModule = getModule('segmentation');

const triggerEvent = (type, detail) => {
  document.dispatchEvent(
    new CustomEvent(type, {
      detail,
      cancelable: true,
    })
  );
};

class XNATRoiApi {
  constructor() {
    this.init();
  }

  init() {
    this._contourRoiToolTypes = [
      TOOL_NAMES.FREEHAND_ROI_3D_TOOL,
      TOOL_NAMES.FREEHAND_ROI_3D_SCULPTOR_TOOL,
    ];
    this._maskRoiToolTypes = [
      TOOL_NAMES.BRUSH_3D_TOOL,
      TOOL_NAMES.BRUSH_3D_AUTO_GATED_TOOL,
      TOOL_NAMES.BRUSH_3D_HU_GATED_TOOL,
      TOOL_NAMES.XNAT_SPHERICAL_BRUSH_TOOL,
      TOOL_NAMES.XNAT_FREEHAND_SCISSORS_TOOL,
      TOOL_NAMES.XNAT_CIRCLE_SCISSORS_TOOL,
      TOOL_NAMES.XNAT_RECTANGLE_SCISSORS_TOOL,
      TOOL_NAMES.XNAT_CORRECTION_SCISSORS_TOOL,
    ];
  }

  isContourRoiTool(toolType) {
    return this._contourRoiToolTypes.includes(toolType);
  }

  isMaskRoiTool(toolType) {
    return this._maskRoiToolTypes.includes(toolType);
  }

  onContourRoiAdded(event) {
    const eventData = event.detail;

    if (this.isContourRoiTool && this.isContourRoiTool(eventData.toolName)) {
      triggerEvent(XNAT_EVENTS.CONTOUR_ADDED, {});
    }
  }

  onContourRoiCompleted(event) {
    const eventData = event.detail;

    if (this.isContourRoiTool && this.isContourRoiTool(eventData.toolName)) {
      const measurementData = eventData.measurementData;
      if (!measurementData || !measurementData.referencedStructureSet) {
        return;
      }

      if (measurementData.invalidated) {
        const image = cornerstone.getEnabledElement(eventData.element).image;
        const { columnPixelSpacing, rowPixelSpacing } = image;

        const StructureSet = measurementData.referencedStructureSet;
        if (StructureSet.isLocked) {
          return;
        }

        const referencedROIContour = measurementData.referencedROIContour;
        const stats = referencedROIContour.stats;

        if (!stats.hasOwnProperty('canCalculateVolume')) {
          const {
            sliceSpacingFirstFrame,
            canCalculateVolume,
            modality,
          } = this.getDisplaySetInfo();
          stats.canCalculateVolume = canCalculateVolume;
          stats.sliceSpacingFirstFrame = sliceSpacingFirstFrame;
          stats.units = getRoiMeasurementUnits(modality, rowPixelSpacing);
        }

        if (stats.canCalculateVolume) {
          const scaling = (columnPixelSpacing || 1) * (rowPixelSpacing || 1);
          const area = calculateContourArea(
            measurementData.handles.points,
            scaling
          );
          stats.areas[measurementData.uid] = area;
          measurementData.area = area;

          stats.volumeCm3 = calculateContourRoiVolume(
            Object.values(stats.areas),
            stats.sliceSpacingFirstFrame
          );
        }

        triggerEvent(XNAT_EVENTS.CONTOUR_COMPLETED, {
          roiContourUid: referencedROIContour.uid,
        });
      }
    }
  }

  onContourRoiRemoved(event) {
    const eventData = event.detail;

    if (this.isContourRoiTool && this.isContourRoiTool(eventData.toolName)) {
      const measurementData = eventData.measurementData;
      const referencedROIContour = measurementData.referencedROIContour;
      const stats = referencedROIContour.stats;
      delete stats.areas[measurementData.uid];

      if (stats.canCalculateVolume) {
        stats.volumeCm3 = calculateContourRoiVolume(
          Object.values(stats.areas),
          stats.sliceSpacingFirstFrame
        );
      }

      triggerEvent(XNAT_EVENTS.CONTOUR_REMOVED, {
        roiContourUid: referencedROIContour.uid,
      });
    }
  }

  onContourRoiInterpolated(event) {
    const eventData = event.detail;
    const measurementData = eventData.measurementData;
    if (!measurementData || !measurementData.referencedStructureSet) {
      return;
    }

    const referencedROIContour = measurementData.referencedROIContour;
    const stats = referencedROIContour.stats;

    if (!stats.canCalculateVolume) {
      return;
    }

    const image = cornerstone.getEnabledElement(eventData.element).image;
    const { columnPixelSpacing, rowPixelSpacing } = image;
    const scaling = (columnPixelSpacing || 1) * (rowPixelSpacing || 1);

    const stackToolState = getToolState(eventData.element, 'stack');
    const imageIds = stackToolState.data[0].imageIds;
    const toolStateManager = globalToolStateManager.saveToolState();
    const roiContourUid = referencedROIContour.uid;

    for (let i = 0; i < imageIds.length; i++) {
      const imageId = imageIds[i];
      const imageToolState = toolStateManager[imageId];

      if (!imageToolState || !imageToolState[TOOL_NAMES.FREEHAND_ROI_3D_TOOL]) {
        continue;
      }

      const interpolatedContours = imageToolState[
        TOOL_NAMES.FREEHAND_ROI_3D_TOOL
      ].data.filter(contour => {
        return contour.interpolated && contour.ROIContourUid === roiContourUid;
      });

      interpolatedContours.forEach(contour => {
        const area = calculateContourArea(contour.handles.points, scaling);
        stats.areas[contour.uid] = area;
        contour.area = area;
      });
    }

    stats.volumeCm3 = calculateContourRoiVolume(
      Object.values(stats.areas),
      stats.sliceSpacingFirstFrame
    );
  }

  onLabelmapAdded(event) {
    triggerEvent(XNAT_EVENTS.LABELMAP_ADDED, {});
  }

  onLabelmapCompleted(event) {
    const eventData = event.detail;
    const { element, activeLabelmapIndex, toolName } = eventData;

    const resetAll2DStats =
      toolName === 'XNATSphericalBrushTool' || toolName === 'MaskUndoRedo';

    const {
      sliceSpacingFirstFrame,
      canCalculateVolume,
      frameIndex,
    } = this.getDisplaySetInfo();

    const image = cornerstone.getEnabledElement(eventData.element).image;
    const { columnPixelSpacing, rowPixelSpacing } = image;
    const voxelScaling =
      (columnPixelSpacing || 1) *
      (rowPixelSpacing || 1) *
      (sliceSpacingFirstFrame || 1);

    const labelmap3D = segmentationModule.getters.labelmap3D(
      element,
      activeLabelmapIndex
    );

    // const activeSegmentIndex = labelmap3D.activeSegmentIndex;
    const allMetadata = labelmap3D.metadata;
    Object.keys(allMetadata).forEach(segmentIndex => {
      if (Number(segmentIndex) === 0) {
        return;
      }

      const metadata = labelmap3D.metadata[segmentIndex];
      const stats = metadata.stats;

      if (!stats.hasOwnProperty('canCalculateVolume')) {
        stats.canCalculateVolume = canCalculateVolume;
        stats.sliceSpacingFirstFrame = sliceSpacingFirstFrame;
      }

      const stats2D = stats.stats2D;
      if (resetAll2DStats) {
        stats2D.forEach(item => (item.invalidated = true));
      } else {
        if (stats2D[frameIndex]) {
          stats2D[frameIndex].invalidated = true;
        }
      }

      if (stats.canCalculateVolume) {
        stats.volumeCm3 = calculateMaskRoiVolume(
          labelmap3D,
          Number(segmentIndex),
          voxelScaling
        );
      }
    });

    triggerEvent(XNAT_EVENTS.LABELMAP_COMPLETED, {});
  }

  getDisplaySetInfo() {
    const viewports = window.store.getState().viewports;
    const activeViewportIndex = viewports.activeViewportIndex;
    const displaySet = viewports.viewportSpecificData[activeViewportIndex];

    return {
      sliceSpacingFirstFrame: displaySet.sliceSpacingFirstFrame,
      canCalculateVolume:
        displaySet.isReconstructable && !displaySet.isMultiFrame,
      modality: displaySet.Modality,
      frameIndex: displaySet.frameIndex,
    };
  }
}

const xnatRoiApi = new XNATRoiApi();

export default xnatRoiApi;
