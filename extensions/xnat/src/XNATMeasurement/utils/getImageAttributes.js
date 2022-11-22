import cornerstone from 'cornerstone-core';
import { utils } from '@ohif/core';

const { studyMetadataManager } = utils;

const getImageAttributes = element => {
  // Get the Cornerstone imageId
  const enabledElement = cornerstone.getEnabledElement(element);
  const imageId = enabledElement.image.imageId;

  const { SOPInstanceUID, Modality } = cornerstone.metaData.get(
    'instance',
    imageId
  );

  const splitImageId = imageId.split('&frame');
  const frameIndex =
    splitImageId[1] !== undefined ? Number(splitImageId[1]) : 0;

  return {
    Modality,
    SOPInstanceUID,
    frameIndex,
    imageId,
  };
};

const getImportedImageId = (displaySetInstanceUID, SOPInstanceUID) => {
  let imageId = undefined;

  const studies = studyMetadataManager.all();
  for (let i = 0; i < studies.length; i++) {
    const study = studies[i];
    const displaySets = study.getDisplaySets();

    for (let j = 0; j < displaySets.length; j++) {
      const displaySet = displaySets[j];

      if (displaySet.displaySetInstanceUID === displaySetInstanceUID) {
        const image = displaySet.images.find(
          image => image.SOPInstanceUID === SOPInstanceUID
        );
        if (image) {
          imageId = image.getImageId();
        }
        break;
      }
    }

    if (imageId) {
      break;
    }
  }

  return imageId;
};

export { getImageAttributes, getImportedImageId };
