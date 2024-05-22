import isSameArray from './isSameArray';

const isDataset4D = instances => {
  const result = {
    is4D: false,
    numberOfSubStacks: 1,
    numberOfSubInstances: instances !== undefined ? instances.length : 0,
    inStackPositionDimension: 3,
    isValid4D: false,
    sameIppIndices: [],
    //
    hasMultiFrameInstances: false,
    hasMosaicInstances: false,
  };

  if (!instances || instances.length < 2) {
    return result;
  }

  result.hasMultiFrameInstances = instances.some(
    instance => instance.metadata.NumberOfFrames > 1
  );
  result.hasMosaicInstances = instances.some(instance =>
    instance.metadata.ImageType.includes('MOSAIC')
  );
  if (result.hasMultiFrameInstances || result.hasMosaicInstances) {
    result.is4D = true;
    return result;
  }

  // Sort instances by InstanceNumber
  instances.sort((a, b) => {
    return (
      parseInt(_getTagValue(a.metadata, 'InstanceNumber', 0)) -
      parseInt(_getTagValue(b.metadata, 'InstanceNumber', 0))
    );
  });

  const ippList = instances.map(
    instance => instance.metadata.ImagePositionPatient
  );
  const validIppList = ippList.filter(
    ipp => Array.isArray(ipp) && ipp.length === 3
  );

  const n = validIppList.length;
  let is4D = false;
  for (let i = 0; i < n; ++i) {
    const ippI = validIppList[i];
    for (let j = i + 1; j < n; ++j) {
      if (isSameArray(ippI, validIppList[j])) {
        is4D = true;
      }
    }
    if (is4D) {
      break;
    }
  }
  result.is4D = is4D;

  if (!is4D || n !== instances.length) {
    return result;
  }

  // Find 4D stride
  const sameIppIndices = [0];
  const strideList = [];
  const firstIpp = validIppList[0];
  for (let i = 1; i < n; ++i) {
    if (isSameArray(firstIpp, validIppList[i])) {
      sameIppIndices.push(i);
      strideList.push(i - sameIppIndices[sameIppIndices.length - 2]);
    }
  }

  // Invalid 4D as the first IPP does not repeat
  if (strideList.length === 0 || sameIppIndices.length === validIppList.length) {
    return result;
  }

  const strideControl = strideList[0];
  const isUniformStride = !strideList.some(stride => stride !== strideControl);
  // Invalid 4D as the stride is not uniform
  if (!isUniformStride) {
    return result;
  }

  // Presume that the IPP varies in intra-instance set (contiguous);
  // that is, every sub-instances group is a 3D set
  let numberOfSubInstances = strideControl;

  // Adjust values if the IPP changes in inter-instance sets (planar)
  if (strideControl === 1) {
    numberOfSubInstances = sameIppIndices.length;
    // The first dimension is reserved for StackID
    result.inStackPositionDimension = 2;
  }

  // Check if we have the same number of instances for all sub-stacks
  if (n % numberOfSubInstances !== 0) {
    return result;
  }

  const numberOfSubStacks = n / numberOfSubInstances;
  result.numberOfSubInstances = numberOfSubInstances;
  result.numberOfSubStacks = numberOfSubStacks;

  // Validate the stride pattern across all instances
  let isValidStride = true;
  if (strideControl === 1) {
    for (let i = 0; i < numberOfSubStacks; ++i) {
      const refIppIndex = numberOfSubInstances * i;
      const ippI = validIppList[refIppIndex];
      for (let j = 1; j < numberOfSubInstances; ++j) {
        const ippIndex = refIppIndex + j;
        if (!isSameArray(ippI, validIppList[ippIndex])) {
          isValidStride = false;
          break;
        }
      }
      if (!isValidStride) {
        break;
      }
    }
  } else {
    for (let i = 0; i < numberOfSubInstances; ++i) {
      const ippI = validIppList[i];
      for (let j = 1; j < numberOfSubStacks; ++j) {
        const ippIndex = i + strideControl * j;
        if (!isSameArray(ippI, validIppList[ippIndex])) {
          isValidStride = false;
          break;
        }
      }
      if (!isValidStride) {
        break;
      }
    }
  }

  if (!isValidStride) {
    return result;
  }

  result.isValid4D = true;
  result.sameIppIndices = sameIppIndices;

  return result;
};

const _getTagValue = (instance, tag, defaultValue) => {
  const value = instance[tag];
  return value !== undefined ? value : defaultValue;
};

export default isDataset4D;
