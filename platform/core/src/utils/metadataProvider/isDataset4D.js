import { Vector3 } from 'cornerstone-math';
import isSameArray from './isSameArray';
import isSameOrientation from './isSameOrientation';

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
    // result.is4D = true;
    return result;
  }

  // Sort instances by InstanceNumber
  instances.sort((a, b) => {
    return (
      parseInt(_getTagValue(a.metadata, 'InstanceNumber', 0)) -
      parseInt(_getTagValue(b.metadata, 'InstanceNumber', 0))
    );
  });

  // Check and re-sort by IPP for duplicate instance numbers
  const instanceNumbers = instances.map(
    instance => parseInt(_getTagValue(instance.metadata, 'InstanceNumber', 0))
  );
  const instanceNumbersSet = new Set(instanceNumbers);
  if (instanceNumbersSet.size !== instanceNumbers.length) {
    // Has duplicate instance numbers
    if (isSameOrientation(instances)) {
      instanceNumbersSet.forEach(instanceNumber => {
        const firstIndex = instanceNumbers.indexOf(instanceNumber);
        const lastIndex = instanceNumbers.lastIndexOf(instanceNumber);
        const subInstances = instances.slice(firstIndex, lastIndex + 1);
        const sortedSubInstances = sortByImagePositionPatient(subInstances);
        if (sortedSubInstances) {
          instances.splice(
            firstIndex,
            sortedSubInstances.length,
            ...sortedSubInstances
          );
        }
      })
    }
  }

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
        break;
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

  // Invalid 4D as the first IPP does not repeat,
  // or all instances share the same IPP
  if (
    strideList.length === 0 ||
    sameIppIndices.length === validIppList.length
  ) {
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

const sortByImagePositionPatient = instances => {
  if (!instances || instances.length < 2) {
    return;
  }

  const ippList = instances.map(
    instance => instance.metadata.ImagePositionPatient
  );
  const validIppList = ippList.filter(
    ipp => Array.isArray(ipp) && ipp.length === 3
  );

  if (validIppList.length !== instances.length) {
    return;
  }

  const refIpp = ippList[0];
  const refIppVec = new Vector3(refIpp[0], refIpp[1], refIpp[2]);

  const refIop = instances[0].metadata.ImageOrientationPatient;
  if (!refIop) {
    return;
  }

  const scanAxisNormal = new Vector3(refIop[0], refIop[1], refIop[2]).cross(
    new Vector3(refIop[3], refIop[4], refIop[5])
  );

  const distanceImagePairs = ippList.map((ipp, index) => {
    const ippVec = new Vector3(...ipp);
    const positionVector = refIppVec.clone().sub(ippVec);
    const distance = positionVector.dot(scanAxisNormal);

    return {
      distance,
      instance: instances[index],
    };
  });

  distanceImagePairs.sort(function(a, b) {
    return a.distance - b.distance;
  });

  const sortedInstances = distanceImagePairs.map(a => a.instance);

  instances.sort(function(a, b) {
    return sortedInstances.indexOf(a) - sortedInstances.indexOf(b);
  });

  return instances;
}

export default isDataset4D;
