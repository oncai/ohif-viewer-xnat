import cornerstone from 'cornerstone-core';
import { utils } from '@ohif/core';

const { studyMetadataManager } = utils;

const getSeriesAttributes = displaySetInstanceUID => {
  let imageId = undefined;

  const studies = studyMetadataManager.all();
  for (let i = 0; i < studies.length; i++) {
    const study = studies[i];
    const displaySets = study.getDisplaySets();

    for (let j = 0; j < displaySets.length; j++) {
      const displaySet = displaySets[j];

      if (displaySet.displaySetInstanceUID === displaySetInstanceUID) {
        imageId = displaySet.images[0].getImageId();
        break;
      }
    }

    if (imageId) {
      break;
    }
  }

  if (imageId) {
    const {
      PatientID,
      PatientName,
      PatientBirthDate = '',
      StudyInstanceUID,
      SeriesInstanceUID,
      Modality,
    } = cornerstone.metaData.get('instance', imageId);

    return {
      PatientID,
      PatientName,
      PatientBirthDate,
      StudyInstanceUID,
      SeriesInstanceUID,
      Modality,
      imageId,
      displaySetInstanceUID,
    };
  }
};

export default getSeriesAttributes;
