import csTools from 'cornerstone-tools';
import { XNAT_EVENTS, refreshViewports } from '../../../utils';

const triggerEvent = csTools.importInternal('util/triggerEvent');
const segmentationModule = csTools.getModule('segmentation');

export default function triggerSegmentCompletedEvent(element, toolName) {
  const { activeLabelmapIndex } = segmentationModule.getters.labelmap2D(
    element
  );

  refreshViewports(element);

  triggerEvent(element, XNAT_EVENTS.PEPPERMINT_SEGMENT_COMPLETE_EVENT, {
    element,
    activeLabelmapIndex,
    toolName,
  });
}
