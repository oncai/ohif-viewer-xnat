import csTools from 'cornerstone-tools';
import { XNAT_EVENTS } from '../../../utils';

const triggerEvent = csTools.importInternal('util/triggerEvent');
const segmentationModule = csTools.getModule('segmentation');

export default function triggerSegmentCompletedEvent(element) {
  const { activeLabelmapIndex } = segmentationModule.getters.labelmap2D(
    element
  );

  triggerEvent(element, XNAT_EVENTS.PEPPERMINT_SEGMENT_COMPLETE_EVENT, {
    element,
    activeLabelmapIndex,
  });
}
