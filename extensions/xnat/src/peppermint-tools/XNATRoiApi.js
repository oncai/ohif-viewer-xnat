import cornerstone from 'cornerstone-core';
import OHIF from '@ohif/core';
import TOOL_NAMES from './toolNames';
import { XNAT_EVENTS } from '../utils';
import { calculateContourArea, calculateContourRoiVolume } from './utils';

const { studyMetadataManager } = OHIF.utils;

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
      const stats = measurementData.referencedROIContour.stats;
      delete stats[measurementData.uid];

      triggerEvent(XNAT_EVENTS.CONTOUR_REMOVED, {});
    }
  }

  onContourRoiInterpolated(event) {
    triggerEvent(XNAT_EVENTS.CONTOUR_INTERPOLATED, {});
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
            canCalculateVolume: displaySet.isReconstructable,
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
