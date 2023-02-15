import csTools from 'cornerstone-tools';
import generateSegmentationMetadata from '../../utils/generateSegmentationMetadata';
import { XNAT_EVENTS } from '../../../utils';

const triggerEvent = csTools.importInternal('util/triggerEvent');
const segmentationModule = csTools.getModule('segmentation');

export default function triggerSegmentGenerationEvent(element) {
  const {
    labelmap3D,
    currentImageIdIndex,
    activeLabelmapIndex,
  } = segmentationModule.getters.labelmap2D(element);

  let segmentIndex = labelmap3D.activeSegmentIndex;
  let metadata = labelmap3D.metadata[segmentIndex];

  if (!metadata) {
    metadata = generateSegmentationMetadata('Unnamed Segment');

    segmentIndex = labelmap3D.activeSegmentIndex = 1;

    segmentationModule.setters.metadata(
      element,
      activeLabelmapIndex,
      segmentIndex,
      metadata
    );

    triggerEvent(element, XNAT_EVENTS.PEPPERMINT_SEGMENT_GENERATION_EVENT, {
      element,
      activeLabelmapIndex,
    });
  }
}
