import cornerstone from 'cornerstone-core';

export default function(element) {
  // Get the Cornerstone imageId
  const enabledElement = cornerstone.getEnabledElement(element);
  const imageId = enabledElement.image.imageId;

  // Get StudyInstanceUID & PatientID
  const {
    PatientID,
    PatientName,
    PatientBirthDate = '',
    StudyInstanceUID,
    SeriesInstanceUID,
    SOPInstanceUID,
  } = cornerstone.metaData.get('instance', imageId);

  const {
    activeViewportIndex,
    viewportSpecificData,
  } = window.store.getState().viewports;
  const { displaySetInstanceUID } = viewportSpecificData[activeViewportIndex];

  const splitImageId = imageId.split('&frame');
  const frameIndex =
    splitImageId[1] !== undefined ? Number(splitImageId[1]) : 0;

  return {
    PatientID,
    PatientName,
    PatientBirthDate,
    StudyInstanceUID,
    SeriesInstanceUID,
    SOPInstanceUID,
    frameIndex,
    imageId,
    displaySetInstanceUID,
  };
}
