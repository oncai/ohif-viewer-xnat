import cloneDeep from 'lodash.clonedeep';
import cornerstone from 'cornerstone-core';
import { OHIFSeriesMetadata, OHIFInstanceMetadata } from '../classes/metadata';
import metadataUtils from './metadataProvider';

const { getTagName } = metadataUtils;

const createSubStacks = (displaySet, ohifStudy) => {
  let subStackGroups;

  try {
    const refImage = displaySet.getImage(0);
    const imageId = refImage.getImageId();
    const refMetadata = cornerstone.metaData.get('instance', imageId);

    const stackDimensionData = buildDimensionData(refMetadata);
    let groupLabels;
    if (stackDimensionData) {
      groupLabels = generateStackGroupLabels(
        stackDimensionData.dimensionPointers
      );
      subStackGroups = sliceStack(
        stackDimensionData,
        refImage,
        ohifStudy,
        groupLabels
      );
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

const sliceStack = (dimensionData, refImage, ohifStudy, groupLabels) => {
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
    instances: _,
    subInstances,
    ...sharedSeriesMetadata
  } = _series;

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
        const stackName = `${groupLabels[i].groupName}-${index}`;
        const seriesData = {
          SeriesInstanceUID: `${SeriesInstanceUID}.${i}.${index}`,
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
          subInstances[j],
          subStack.ohifSeries,
          ohifStudy
        )
      );
    });
  }

  return subStackGroups;
};

const buildDimensionData = refMetadata => {
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

const generateStackGroupLabels = dimensionPointers => {
  const groupLabels = dimensionPointers.map(dimension => {
    const dimensionName = dimension.indexPointer;
    const dimensionId = dimension.indexAbbreviation;
    const { groupName, groupId } = getStackGroupNameAndAbbreviation(
      dimensionName,
      dimensionId
    );
    return {
      groupName,
      groupId,
      dimensionName,
      dimensionId,
    };
  });

  return groupLabels;
};

const getStackGroupNameAndAbbreviation = (dimensionName, dimensionId) => {
  const data = { groupName: dimensionName, groupId: dimensionId };

  if (dimensionName === 'InStackPositionNumber') {
    data.groupName = 'Position';
    data.groupId = 'POS';
  } else if (dimensionName.includes('Echo')) {
    data.groupName = 'Echo';
    data.groupId = 'ECHO';
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
        label: 'All Frames',
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
