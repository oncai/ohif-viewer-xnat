import cornerstone from 'cornerstone-core';
import { OHIFSeriesMetadata, OHIFInstanceMetadata } from '../classes/metadata';
import metadataUtils from './metadataProvider';

const { getTagName, isSameArray } = metadataUtils;

const SUPPORTED_4D_MODALITIES = ['MR'];

const createSubStacks = (displaySet, ohifStudy) => {
  const refImage = displaySet.getImage(0);
  const imageId = refImage.getImageId();
  const refMetadata = cornerstone.metaData.get('instance', imageId);

  let subStackGroups;
  let stackDimensionData;
  let groupLabels;

  try {
    if (displaySet.isEnhanced) {
      stackDimensionData = buildDimensionDataForEnhanced(refMetadata);
      if (stackDimensionData) {
        groupLabels = generateStackGroupLabels(
          stackDimensionData.dimensionPointers
        );
        subStackGroups = sliceStack(
          stackDimensionData,
          refImage,
          ohifStudy,
          groupLabels,
          true
        );
      }
    } else if (
      displaySet.is4D &&
      SUPPORTED_4D_MODALITIES.includes(displaySet.Modality)
    ) {
      stackDimensionData = buildDimensionDataFor4D(displaySet);
      if (stackDimensionData) {
        groupLabels = generateStackGroupLabels(
          stackDimensionData.dimensionPointers
        );
        subStackGroups = sliceStack(
          stackDimensionData,
          refImage,
          ohifStudy,
          groupLabels,
          false
        );
      }
    }

    if (
      subStackGroups &&
      subStackGroups.length === stackDimensionData.dimensionPointers.length
    ) {
      displaySet.setAttribute('isMultiStack', true);
      displaySet.setAttribute('subStackGroups', subStackGroups);
      displaySet.setAttribute('subStackGroupData', {
        groupLabels,
        dimensionValues: stackDimensionData.dimensionValues,
      });
    }
  } catch (error) {
    console.error(
      'Error while adding sub-stacks. Could not generate stack dimension data.',
      error
    );
  }

  return subStackGroups;
};

const sliceStack = (
  dimensionData,
  refImage,
  ohifStudy,
  groupLabels,
  isSlicingForEnhanced
) => {
  const {
    dimensionIndices,
    dimensionValues,
    dimensionPointers,
  } = dimensionData;

  const { _series } = refImage;
  const {
    SeriesInstanceUID,
    SeriesDescription,
    SeriesNumber,
    instances: _, // Omit instances from sharedSeriesMetadata
    subInstances,
    ...sharedSeriesMetadata
  } = _series;

  const instancesSrc = isSlicingForEnhanced ? subInstances : _series.instances;

  const subStackGroups = [];

  // Create substacks
  // Ignore the first dimension - StackID (the first/slowest index)
  const validIndices = Array.from(
    { length: dimensionPointers.length - 1 },
    (_, i) => i + 1
  );
  for (let i = 1; i < dimensionPointers.length; i++) {
    const mainDimensionIndex = i;
    const otherDimensionIndices = validIndices.filter(v => v !== i);
    dimensionIndices.forEach((dimension, j) => {
      const index = dimension[i];
      const stackId = `${groupLabels[i].groupId}-${index}`;
      let subStack = subStackGroups[i] && subStackGroups[i][stackId];
      if (!subStack) {
        let stackName = `${groupLabels[i].groupName}-${index}`;
        const groupUnit = groupLabels[i].groupUnit;
        if (groupUnit) {
          stackName += ` (${dimensionValues[j][i]} ${groupUnit})`;
        }
        const seriesData = {
          SeriesInstanceUID: isSlicingForEnhanced
            ? `${SeriesInstanceUID}.${i}.${index}`
            : SeriesInstanceUID,
          SeriesDescription: `${SeriesDescription}-${stackName}`,
          SeriesNumber: `${SeriesNumber}${i}${index}`,
          ...sharedSeriesMetadata,
          instances: [],
        };
        const ohifSeries = new OHIFSeriesMetadata(seriesData, ohifStudy);
        ohifStudy.addSeries(ohifSeries);
        //
        if (!subStackGroups[i]) {
          subStackGroups[i] = {};
        }
        subStackGroups[i][stackId] = {
          mainDimensionIndex,
          otherDimensionIndices,
          stackId,
          stackName,
          refIndices: [],
          ohifSeries,
        };
        subStack = subStackGroups[i][stackId];
      }
      subStack.refIndices.push(j);
      subStack.ohifSeries.addInstance(
        new OHIFInstanceMetadata(
          instancesSrc[j],
          subStack.ohifSeries,
          ohifStudy
        )
      );
    });
  }

  return subStackGroups;
};

const buildDimensionDataForEnhanced = refMetadata => {
  const {
    NumberOfFrames,
    DimensionOrganizationSequence,
    DimensionIndexSequence,
    PerFrameFunctionalGroupsSequence,
  } = refMetadata;

  // For now, only a single DimensionOrganizationUID is supported.
  if (
    !DimensionOrganizationSequence ||
    !Array.isArray(DimensionOrganizationSequence) ||
    DimensionOrganizationSequence.length !== 1
  ) {
    throw new Error('Invalid DimensionOrganizationSequence.');
  }

  const DimensionOrganizationUID =
    DimensionOrganizationSequence[0].DimensionOrganizationUID;
  if (!DimensionOrganizationUID) {
    throw new Error('Invalid DimensionOrganizationSequence.');
  }

  const dimensionPointers = [];
  DimensionIndexSequence.forEach(data => {
    if (
      !data.DimensionOrganizationUID ||
      !data.FunctionalGroupPointer ||
      !data.DimensionIndexPointer
    ) {
      return;
    }
    if (data.DimensionOrganizationUID !== DimensionOrganizationUID) {
      return;
    }
    const groupPointer = getTagName(data.FunctionalGroupPointer);
    const indexPointer = getTagName(data.DimensionIndexPointer);
    if (!groupPointer || !indexPointer) {
      return;
    }
    const indexAbbreviation = indexPointer.match(/[A-Z]/g).join('');
    dimensionPointers.push({ groupPointer, indexPointer, indexAbbreviation });
  });

  // Make sure that all entries in DimensionIndexSequence
  // have the same DimensionOrganizationUID.
  if (dimensionPointers.length !== DimensionIndexSequence.length) {
    throw new Error(
      'Multiple DimensionOrganizationUID configuration is not supported.'
    );
  }

  if (dimensionPointers.length > 3) {
    throw new Error(
      'DimensionIndexSequence larger than 3 dimensions (4D+ configuration) is not supported.'
    );
  }

  const dimensionIndices = [];
  const dimensionValues = [];

  // Look for pointers in the per-frame functional group.
  PerFrameFunctionalGroupsSequence.forEach((frameMetadata, index) => {
    const FrameContentSequence = frameMetadata.FrameContentSequence;
    if (
      !FrameContentSequence ||
      !Array.isArray(FrameContentSequence) ||
      FrameContentSequence.length !== 1
    ) {
      return;
    }

    const values = [];
    dimensionPointers.forEach(dimension => {
      const value =
        frameMetadata[dimension.groupPointer][0][dimension.indexPointer];
      if (value) {
        values.push(value);
      }
    });
    dimensionValues.push(values);

    if (values.length !== dimensionPointers.length) {
      return;
    }

    const DimensionIndexValues = FrameContentSequence[0].DimensionIndexValues;
    if (
      DimensionIndexValues &&
      Array.isArray(DimensionIndexValues) &&
      DimensionIndexValues.length === dimensionPointers.length
    ) {
      dimensionIndices.push([...DimensionIndexValues]);
    }
  });

  if (dimensionIndices.length !== NumberOfFrames) {
    throw new Error('Some frames have missing dimension indices.');
  }

  return {
    dimensionIndices,
    dimensionValues,
    dimensionPointers,
  };
};

const buildDimensionDataFor4D = displaySet => {
  const { numImageFrames, numberOfSubInstances, images } = displaySet;
  const numSubStacks = numImageFrames / numberOfSubInstances;

  // Check if we have the correct number of images
  if (numImageFrames % numberOfSubInstances !== 0) {
    return;
  }

  const subsetInstances = [];
  for (let i = 0; i < numberOfSubInstances; i++) {
    const image = displaySet.getImage(i);
    const imageId = image.getImageId();
    subsetInstances.push(cornerstone.metaData.get('instance', imageId));
  }

  // Validate that the first set of instances share the same position.
  let firstSetSharesIop = true;
  const refIop = subsetInstances[0].ImagePositionPatient;
  if (!refIop) {
    return;
  }
  for (let i = 1; i < numberOfSubInstances; i++) {
    const iop = subsetInstances[i].ImagePositionPatient;
    if (!iop || !isSameArray(refIop, iop)) {
      firstSetSharesIop = false;
      break;
    }
  }
  if (!firstSetSharesIop) {
    return;
  }

  const dimensionPointers = buildDimensionPointersFor4D(subsetInstances);

  if (dimensionPointers.length !== 3) {
    return;
  }

  const dimensionValues = [];
  const dimensionIndices = [];
  const indexPointer = dimensionPointers[2].indexPointer;
  const indexPointerValues = subsetInstances.map(
    instance => instance[indexPointer]
  );
  for (let i = 0; i < numSubStacks; i++) {
    for (let j = 0; j < numberOfSubInstances; j++) {
      dimensionValues.push([
        1, // StackID
        i + 1, // InStackPositionNumber
        indexPointerValues[j],
      ]);
      dimensionIndices.push([
        1, // StackID
        i + 1, // InStackPositionNumber
        j + 1,
      ]);
    }
  }

  return {
    dimensionIndices,
    dimensionValues,
    dimensionPointers,
  };
};

const buildDimensionPointersFor4D = instances => {
  const modality = instances[0].Modality;

  // Build dimension pointers assuming the dataset is 4D:
  // [Full_Stack_Index, Position_Index, Dimension_Variant]
  const dimensionPointers = [];

  // Add StackID and InStackPosition pointers
  dimensionPointers.push({
    groupPointer: '',
    indexPointer: 'StackID',
    indexAbbreviation: 'SID',
  });
  dimensionPointers.push({
    groupPointer: '',
    indexPointer: 'InStackPositionNumber',
    indexAbbreviation: 'ISPN',
  });

  const findValidDimension = indexPointer => {
    let isDimensionPointer = true;
    for (let i = 0; i < instances.length; i++) {
      const itemI = instances[i][indexPointer];
      if (itemI === undefined || !isDimensionPointer) {
        isDimensionPointer = false;
        break;
      }
      for (let j = 0; j < instances.length; j++) {
        if (i === j) {
          continue;
        }
        const itemJ = instances[j][indexPointer];
        if (itemJ === undefined || itemJ === itemI) {
          isDimensionPointer = false;
          break;
        }
      }
    }

    return isDimensionPointer
      ? {
          groupPointer: '',
          indexPointer,
          indexAbbreviation: indexPointer.match(/[A-Z]/g).join(''),
        }
      : undefined;
  };

  if (modality === 'MR') {
    // Check for EchoTime
    const echoTime = findValidDimension('EchoTime');
    if (echoTime) {
      dimensionPointers.push(echoTime);
    }
    const diffusionBValue = findValidDimension('DiffusionBValue');
    if (diffusionBValue) {
      dimensionPointers.push(diffusionBValue);
    }
  }

  return dimensionPointers;
};

const generateStackGroupLabels = dimensionPointers => {
  const groupLabels = dimensionPointers.map(dimension => {
    const dimensionName = dimension.indexPointer;
    const dimensionId = dimension.indexAbbreviation;
    const { groupName, groupId, groupUnit } = getStackGroupNameAndAbbreviation(
      dimensionName,
      dimensionId
    );
    return {
      groupName,
      groupId,
      groupUnit,
      dimensionName,
      dimensionId,
    };
  });

  return groupLabels;
};

const getStackGroupNameAndAbbreviation = (dimensionName, dimensionId) => {
  const data = {
    groupName: dimensionName,
    groupId: dimensionId,
    groupUnit: '',
  };

  if (dimensionName === 'InStackPositionNumber') {
    data.groupName = 'Position';
    data.groupId = 'POS';
  } else if (dimensionName === 'DiffusionBValue') {
    data.groupName = 'BValue';
    data.groupId = 'BVALUE';
  } else if (dimensionName.includes('Echo')) {
    data.groupName = 'Echo';
    data.groupId = 'ECHO';
    data.groupUnit = 'ms';
  }

  return data;
};

const generateSubStackTree = refDisplaySet => {
  const subStackGroups = refDisplaySet.subStackGroups;
  const subStackGroupData = refDisplaySet.subStackGroupData;
  const { groupLabels } = subStackGroupData;

  const stackInfoTree = [];

  // Add option entry for the multi-stack set (all images)
  stackInfoTree.push({
    label: 'Multi-Stack',
    stacks: [
      {
        value: refDisplaySet.displaySetInstanceUID,
        label: 'All Frames (Multi-Stack)',
        displaySet: refDisplaySet,
      },
    ],
  });

  const getSubStackGroupData = () => {
    return subStackGroupData;
  };

  subStackGroups.forEach((group, groupIndex) => {
    const stacks = [];
    Object.keys(group).forEach(key => {
      const subStack = group[key];
      subStack.getSubStackGroupData = getSubStackGroupData;
      const { stackName, displaySet } = subStack;
      stacks.push({
        value: displaySet.displaySetInstanceUID,
        label: stackName,
        displaySet,
      });
    });
    stackInfoTree.push({
      label: groupLabels[groupIndex].dimensionName,
      stacks,
    });
  });

  subStackGroupData.stackInfoTree = stackInfoTree;

  // Build ungrouped list for easier access to subStack info
  const stackInfoList = [];
  stackInfoTree.forEach(group => {
    group.stacks.forEach(stackInfo => stackInfoList.push(stackInfo));
  });

  subStackGroupData.stackInfoList = stackInfoList;

  // Multi-Stack is on by default for all  viewports
  const viewportActiveStackInfo = [];
  const numViewports = 9;
  for (let i = 0; i < numViewports; i++) {
    viewportActiveStackInfo.push(stackInfoList[0]);
  }
  subStackGroupData.viewportActiveStackInfo = viewportActiveStackInfo;

  //
  subStackGroupData.getStackDisplaySet = options => {
    const { viewportIndex, displaySetInstanceUID } = options;
    if (viewportIndex !== undefined) {
      const stackInfo = viewportActiveStackInfo[viewportIndex];
      if (stackInfo) {
        return stackInfo.displaySet;
      }
    } else if (displaySetInstanceUID) {
      const stackInfo = stackInfoList.find(
        stackInfo => stackInfo.value === displaySetInstanceUID
      );
      if (stackInfo) {
        return stackInfo.displaySet;
      }
    }
  };

  //
  subStackGroupData.updateViewportActiveStackInfo = options => {
    const { viewportIndex, displaySetInstanceUID } = options;
    if (displaySetInstanceUID) {
      const stackInfo = stackInfoList.find(
        stackInfo => stackInfo.value === displaySetInstanceUID
      );
      if (stackInfo) {
        viewportActiveStackInfo[viewportIndex] = stackInfo;
      }
    }
  };

  //
  subStackGroupData.hasActiveDisplaySet = activeDisplaySetInstanceUID => {
    const stackInfo = stackInfoList.find(
      stackInfo => stackInfo.value === activeDisplaySetInstanceUID
    );

    return stackInfo !== undefined;
  };
};

export { createSubStacks, generateSubStackTree };
