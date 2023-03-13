import {
  store,
  globalImageIdSpecificToolStateManager,
} from 'cornerstone-tools';

import { PEPPERMINT_TOOL_NAMES } from '../peppermint-tools';

const modules = store.modules;
const globalToolStateManager = globalImageIdSpecificToolStateManager;

const { FREEHAND_ROI_3D_TOOL } = PEPPERMINT_TOOL_NAMES;

const removeContourRoi = (
  SeriesInstanceUID,
  structureSetUid,
  roiContourUid
) => {
  // Remove modules entry
  modules.freehand3D.setters.deleteROIFromStructureSet(
    SeriesInstanceUID,
    structureSetUid,
    roiContourUid
  );

  // Remove tool state
  const toolStateManager = globalToolStateManager.saveToolState();
  Object.keys(toolStateManager).forEach(imageId => {
    if (
      toolStateManager[imageId] &&
      toolStateManager[imageId][FREEHAND_ROI_3D_TOOL]
    ) {
      const toolState = toolStateManager[imageId][FREEHAND_ROI_3D_TOOL];
      toolState.data = toolState.data.filter(
        data => data.ROIContourUid !== roiContourUid
      );
    }
  });
};

export default removeContourRoi;
