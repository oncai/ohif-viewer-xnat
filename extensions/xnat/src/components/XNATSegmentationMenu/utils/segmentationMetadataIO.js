import cornerstoneTools from 'cornerstone-tools';
import { generateSegmentationMetadata } from '../../../peppermint-tools';

const segmentationModule = cornerstoneTools.getModule('segmentation');

export function newSegmentInput(segIndex, metadata) {
  brushMetdataInput(segIndex, metadata, segmentInputCallback);
}

export function editSegmentInput(segIndex, metadata) {
  brushMetdataInput(segIndex, metadata, segmentInputCallback);
}

export function newSegment(enabledElement) {
  if (!enabledElement) {
    return [];
  }

  const activeElement = enabledElement.element;

  let segmentMetadata = segmentationModule.getters.metadata(activeElement);

  if (!Array.isArray(segmentMetadata)) {
    const { labelmap3D } = segmentationModule.getters.getAndCacheLabelmap2D(
      activeElement
    );

    segmentMetadata = labelmap3D.metadata;
  }

  const colormap = segmentationModule.getters.activeCornerstoneColorMap(
    activeElement
  );

  const numberOfColors = colormap.getNumberOfColors();

  for (let i = 1; i < numberOfColors; i++) {
    if (!segmentMetadata[i]) {
      newSegmentInput(i);
      break;
    }
  }
}

function segmentInputCallback(data) {
  if (!data) {
    return;
  }

  const { label, categoryUID, typeUID, modifierUID, segIndex, element } = data;

  const metadata = generateSegmentationMetadata(
    label,
    categoryUID,
    typeUID,
    modifierUID
  );

  // TODO -> support for multiple labelmaps.
  segmentationModule.setters.metadata(element, 0, segIndex, metadata);
  segmentationModule.setters.activeSegmentIndex(element, segIndex);
}

/**
 * Opens the brushMetadata dialog.
 *
 */

// TODO -> Need to make this into a react-modal?
function brushMetdataInput(segIndex, metadata, callback) {
  console.log('TODO: Remake brushMetadata input menu!');
  /*
  const brushMetadataDialog = document.getElementById('brushMetadataDialog');
  const dialogData = Blaze.getData(brushMetadataDialog);
  dialogData.brushMetadataDialogSegIndex.set(segIndex);
  dialogData.brushMetadataDialogMetadata.set(metadata);
  dialogData.brushMetadataDialogCallback.set(callback);
  brushMetadataDialog.showModal();
  */
}
