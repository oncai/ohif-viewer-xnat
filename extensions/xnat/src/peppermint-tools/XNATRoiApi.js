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
          } = this.getDisplaySetInfo(measurementData.seriesInstanceUid);
          stats.canCalculateVolume = canCalculateVolume;
          stats.sliceSpacingFirstFrame = sliceSpacingFirstFrame;
        }

        if (stats.canCalculateVolume) {
          const image = cornerstone.getEnabledElement(eventData.element).image;
          const { columnPixelSpacing, rowPixelSpacing } = image;
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
    const { element, activeLabelmapIndex } = eventData;

    const labelmap3D = segmentationModule.getters.labelmap3D(
      element,
      activeLabelmapIndex
    );
    const segmentIndex = labelmap3D.activeSegmentIndex;
    const metadata = labelmap3D.metadata[segmentIndex];
    const stats = metadata.stats;

    const image = cornerstone.getEnabledElement(eventData.element).image;
    if (!stats.hasOwnProperty('canCalculateVolume')) {
      const { seriesInstanceUID } = cornerstone.metaData.get(
        'generalSeriesModule',
        image.imageId
      );
      const {
        sliceSpacingFirstFrame,
        canCalculateVolume,
      } = this.getDisplaySetInfo(seriesInstanceUID);
      stats.canCalculateVolume = canCalculateVolume;
      stats.sliceSpacingFirstFrame = sliceSpacingFirstFrame;
    }

    if (stats.canCalculateVolume) {
      const { columnPixelSpacing, rowPixelSpacing } = image;
      const voxelScaling =
        (columnPixelSpacing || 1) *
        (rowPixelSpacing || 1) *
        (stats.sliceSpacingFirstFrame || 1);

      stats.volumeCm3 = calculateMaskRoiVolume(
        labelmap3D,
        segmentIndex,
        voxelScaling
      );
    }

    triggerEvent(XNAT_EVENTS.LABELMAP_COMPLETED, {
      roiMaskUid: metadata.uid,
    });
  }

  getDisplaySetInfo(SeriesInstanceUID) {
    const studies = studyMetadataManager.all();
    for (let i = 0; i < studies.length; i++) {
      const study = studies[i];
      const displaySets = study.getDisplaySets();

      for (let j = 0; j < displaySets.length; j++) {
        const displaySet = displaySets[j];

        if (displaySet.SeriesInstanceUID === SeriesInstanceUID) {
          return {
            sliceSpacingFirstFrame: displaySet.sliceSpacingFirstFrame,
            canCalculateVolume:
              displaySet.isReconstructable && !displaySet.isMultiFrame,
          };
        }
      }
    }

    return {
      sliceSpacingFirstFrame: undefined,
      canCalculateVolume: false,
    };
  }
}

const xnatRoiApi = new XNATRoiApi();

export default xnatRoiApi;
