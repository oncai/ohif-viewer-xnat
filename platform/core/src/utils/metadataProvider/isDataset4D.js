import isSameArray from './isSameArray';

const seriesUidIs4DInfo = new Map();

const isDataset4D = (seriesInstanceUID, instances) => {
  let is4DInfo = seriesUidIs4DInfo.get(seriesInstanceUID);

  if (is4DInfo) {
    return is4DInfo;
  }

  if (!instances) {
    return { is4D: false > 1, numberOfSubInstances: 1 };
  }

  // Sort instances by InstanceNumber
  instances.sort((a, b) => {
    return (
      parseInt(_getTagValue(a.metadata, 'InstanceNumber', 0)) -
      parseInt(_getTagValue(b.metadata, 'InstanceNumber', 0))
    );
  });

  // Number of instances sharing the same IPP
  let numberOfSubInstances = 1;
  const n = instances.length;
  for (let ii = 0; ii < n; ++ii) {
    const instanceMetadataControl = instances[ii].metadata;
    if (
      !instanceMetadataControl ||
      !instanceMetadataControl.ImagePositionPatient
    ) {
      continue;
    }
    for (let jj = ii + 1; jj < n; ++jj) {
      const instanceMetadata = instances[jj].metadata;
      if (!instanceMetadata || !instanceMetadata.ImagePositionPatient) {
        continue;
      }

      if (
        isSameArray(
          instanceMetadataControl.ImagePositionPatient,
          instanceMetadata.ImagePositionPatient
        )
      ) {
        numberOfSubInstances++;
      }
    }
    if (numberOfSubInstances > 1) {
      break;
    }
  }

  is4DInfo = { is4D: numberOfSubInstances > 1, numberOfSubInstances };
  seriesUidIs4DInfo.set(seriesInstanceUID, is4DInfo);

  return is4DInfo;
};

const _getTagValue = (instance, tag, defaultValue) => {
  const value = instance[tag];
  return value !== undefined ? value : defaultValue;
};

export default isDataset4D;
