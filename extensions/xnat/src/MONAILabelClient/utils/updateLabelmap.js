import csTools from 'cornerstone-tools';
import { MONAI_MODEL_TYPES } from '../api';

const modules = csTools.store.modules;
const segmentationModule = csTools.getModule('segmentation');

const updateLabelmap = (
  model,
  labelmap3D,
  maskArrayBuffer,
  maskSize,
  frameIndex,
  segIndices
) => {
  const { type: modelType, dimension: modelDimension } = model;
  const { width, height, numberOfFrames } = maskSize;
  const sliceLength = width * height;
  const valuesToUpdate = [0, ...segIndices];

  const updateSlice = sliceIndex => {
    const sliceOffset = sliceLength * sliceIndex;
    const sliceArray = maskArrayBuffer.subarray(
      sliceOffset,
      sliceOffset + sliceLength
    );
    const imageHasData = sliceArray.some(pixel => pixel !== 0);
    if (!imageHasData) {
      return;
    }
    const labelmap = segmentationModule.getters.labelmap2DByImageIdIndex(
      labelmap3D,
      sliceIndex,
      height,
      width
    );
    const labelmapData = labelmap.pixelData;

    for (let i = 0; i < sliceArray.length; i++) {
      if (valuesToUpdate.includes(labelmapData[i])) {
        labelmapData[i] = sliceArray[i];
      }
    }
    segmentationModule.setters.updateSegmentsOnLabelmap2D(labelmap);
  };

  if (modelDimension === 2) {
    if (frameIndex === undefined) {
      throw new Error('2D Model: No image frame index was provided');
    }
    updateSlice(frameIndex);
  } else {
    for (let s = 0; s < numberOfFrames; s++) {
      updateSlice(s);
    }
  }

  return true;
};

export default updateLabelmap;
