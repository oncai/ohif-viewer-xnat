import cloneDeep from 'lodash.clonedeep';
import { Vector3 } from 'cornerstone-math';
import findValueInNestedMetadata from './findValueInNestedMetadata';

const parseEnhancedSOP = enhancedInstance => {
  let parsedInstances;
  try {
    parsedInstances = _parse(enhancedInstance);
  } catch (error) {
    console.error(
      'Could not parse individual instances from the Enhanced image data.',
      error
    );
  }

  return parsedInstances;
};

const _parse = rootInstance => {
  const {
    NumberOfFrames,
    SharedFunctionalGroupsSequence,
    PerFrameFunctionalGroupsSequence,
  } = rootInstance;

  if (
    !PerFrameFunctionalGroupsSequence ||
    !Array.isArray(PerFrameFunctionalGroupsSequence) ||
    PerFrameFunctionalGroupsSequence.length !== NumberOfFrames
  ) {
    throw new Error('Invalid PerFrameFunctionalGroupsSequence attribute.');
  }

  const shared =
    SharedFunctionalGroupsSequence && SharedFunctionalGroupsSequence[0]
      ? SharedFunctionalGroupsSequence[0]
      : [];

  const getFromRootOrShared = attribute => {
    return (
      rootInstance[attribute] || findValueInNestedMetadata(shared, attribute)
    );
  };

  const masterInstance = {
    // PATIENT_MODULE
    PatientName: rootInstance.PatientName,
    PatientID: rootInstance.PatientID,
    // PATIENT_STUDY_MODULE
    PatientAge: rootInstance.PatientAge,
    PatientSize: rootInstance.PatientSize,
    PatientWeight: rootInstance.PatientWeight,
    // GENERAL_STUDY_MODULE
    StudyInstanceUID: rootInstance.StudyInstanceUID,
    StudyDescription: rootInstance.StudyDescription,
    StudyDate: rootInstance.StudyDate,
    StudyTime: rootInstance.StudyTime,
    AccessionNumber: rootInstance.AccessionNumber,
    // GENERAL_SERIES_MODULE
    Modality: rootInstance.Modality,
    SeriesInstanceUID: rootInstance.SeriesInstanceUID,
    SeriesNumber: rootInstance.SeriesNumber,
    SeriesDate: rootInstance.SeriesDate,
    SeriesTime: rootInstance.SeriesTime,
    SeriesDescription: rootInstance.SeriesDescription,
    // IMAGE_PLANE_MODULE
    ImageOrientationPatient: getFromRootOrShared('ImageOrientationPatient'),
    ImagePositionPatient: getFromRootOrShared('ImagePositionPatient'),
    PixelSpacing: getFromRootOrShared('PixelSpacing'),
    SliceThickness: getFromRootOrShared('SliceThickness'),
    SpacingBetweenSlices: getFromRootOrShared('SpacingBetweenSlices'),
    // IMAGE_PIXEL_MODULE
    SamplesPerPixel: rootInstance.SamplesPerPixel,
    PhotometricInterpretation: rootInstance.PhotometricInterpretation,
    Rows: rootInstance.Rows,
    Columns: rootInstance.Columns,
    BitsAllocated: rootInstance.BitsAllocated,
    BitsStored: rootInstance.BitsStored,
    HighBit: rootInstance.HighBit,
    PixelRepresentation: rootInstance.PixelRepresentation,
    PlanarConfiguration: rootInstance.PlanarConfiguration,
    // VOI_LUT_MODULE
    WindowCenter: getFromRootOrShared('WindowCenter'),
    WindowWidth: getFromRootOrShared('WindowWidth'),
    // MODALITY_LUT_MODULE
    RescaleSlope: getFromRootOrShared('RescaleSlope'),
    RescaleIntercept: getFromRootOrShared('RescaleIntercept'),
    RescaleType: getFromRootOrShared('RescaleType'),
    // SOP_COMMON_MODULE
    SOPClassUID: rootInstance.SOPClassUID,
    SOPInstanceUID: rootInstance.SOPInstanceUID,
    // GENERAL_IMAGE_MODULE
    InstanceNumber: rootInstance.InstanceNumber,
    LossyImageCompression: rootInstance.LossyImageCompression,
    LossyImageCompressionRatio: rootInstance.LossyImageCompressionRatio,
    LossyImageCompressionMethod: rootInstance.LossyImageCompressionMethod,
    // CINE_MODULE
    FrameTime: rootInstance.FrameTime,
    // Set as an individual frame
    NumberOfFrames: 1,
    // Others - part of the above modules
    AcquisitionNumber: rootInstance.AcquisitionNumber,
    FrameOfReferenceUID: rootInstance.FrameOfReferenceUID,
    ImageType: rootInstance.ImageType,
  };

  const instances = [];

  for (let i = 0; i < NumberOfFrames; i++) {
    const perFrame = PerFrameFunctionalGroupsSequence[i];

    const instance = cloneDeep(masterInstance);
    fillInstanceData(instance, perFrame, i);
    instances.push(instance);
  }

  return instances;
};

const fillInstanceData = (instance, perFrame, frameIndex) => {
  /* Tags to replace
    'ImageOrientationPatient',
    'PixelSpacing',
    'SpacingBetweenSlices',
    'ImagePositionPatient',
    'WindowCenter',
    'WindowWidth',
    'RescaleSlope',
    'RescaleIntercept',
    'RescaleType',
    'SOPInstanceUID',
    'InstanceNumber',
    */

  const getFromPerFrameOrInstance = attribute => {
    return (
      findValueInNestedMetadata(perFrame, attribute) || instance[attribute]
    );
  };

  // ImageOrientationPatient
  instance.ImageOrientationPatient = getFromPerFrameOrInstance(
    'ImageOrientationPatient'
  );
  if (!instance.ImageOrientationPatient) {
    throw new Error(
      `Attribute ImageOrientationPatient for frame ${frameIndex} is missing.`
    );
  }

  // PixelSpacing
  instance.PixelSpacing = getFromPerFrameOrInstance(
    'PixelSpacing'
  );

  // PixelSpacing
  instance.SpacingBetweenSlices = getFromPerFrameOrInstance(
    'SpacingBetweenSlices'
  );

  // PixelSpacing
  instance.SliceThickness = getFromPerFrameOrInstance(
    'SliceThickness'
  );

  // ImagePositionPatient
  let ipp = findValueInNestedMetadata(perFrame, 'ImagePositionPatient');
  if (ipp) {
    instance.ImagePositionPatient = ipp;
  } else {
    // The same ImagePositionPatient values are shared between all frames
    ipp = instance.ImagePositionPatient;
    if (!ipp) {
      throw new Error(
        `Attribute ImagePositionPatient for frame ${frameIndex} is missing.`
      );
    }
    const iop = instance.ImageOrientationPatient;
    // Calculate normal and increment IPP using slice spacing or thickness
    const axisNormal = new Vector3(iop[0], iop[1], iop[2]).cross(
      new Vector3(iop[3], iop[4], iop[5])
    );
    let increment;
    if (instance.SpacingBetweenSlices) {
      increment = instance.SpacingBetweenSlices;
    } else if (instance.SliceThickness) {
      increment = instance.SliceThickness;
    } else {
      // Use 1 mm increment as last resort
      increment = 1.0;
    }
    axisNormal.multiplyScalar(increment);
    instance.ImagePositionPatient = [
      axisNormal.x * frameIndex + ipp[0],
      axisNormal.y * frameIndex + ipp[1],
      axisNormal.z * frameIndex + ipp[2],
    ];
  }

  // VOI_LUT_MODULE
  instance.WindowCenter = getFromPerFrameOrInstance('WindowCenter');
  instance.WindowWidth = getFromPerFrameOrInstance('WindowWidth');

  // MODALITY_LUT_MODULE
  instance.RescaleSlope = getFromPerFrameOrInstance('RescaleSlope');
  instance.RescaleIntercept = getFromPerFrameOrInstance('RescaleIntercept');
  instance.RescaleType = getFromPerFrameOrInstance('RescaleType');

  // InstanceNumber
  const sopInstanceUID = findValueInNestedMetadata(perFrame, 'SOPInstanceUID');
  if (sopInstanceUID !== undefined) {
    instance.SOPInstanceUID = sopInstanceUID;
  } else {
    instance.SOPInstanceUID = `${instance.SOPInstanceUID}.${frameIndex}`;
  }

  // InstanceNumber
  const instanceNumber = findValueInNestedMetadata(perFrame, 'InstanceNumber');
  if (instanceNumber !== undefined) {
    instance.InstanceNumber = instanceNumber;
  } else {
    instance.InstanceNumber += frameIndex;
  }
};

export default parseEnhancedSOP;
