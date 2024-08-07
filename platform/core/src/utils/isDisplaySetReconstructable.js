import cornerstone from 'cornerstone-core';
import { ReconstructionIssues } from './../enums.js';

/**
 * Checks if a series is reconstructable to a 3D volume.
 *
 * @param {Object[]} An array of `OHIFInstanceMetadata` objects.
 *
 * @returns {Object} value, reconstructionIssues.
 */
function isDisplaySetReconstructable(instances) {
  if (!instances.length) {
    return { isReconstructable: false };
  }

  const firstInstance = instances[0].getData().metadata;

  const Modality = firstInstance.Modality;
  const isMultiframe = firstInstance.NumberOfFrames > 1;

  if (!constructableModalities.includes(Modality)) {
    return {
      isReconstructable: false,
      reconstructionIssues: [],
    };
  }

  // Can't reconstruct if we only have one image.
  if (!isMultiframe && instances.length === 1) {
    return {
      isReconstructable: false,
      reconstructionIssues: [],
    };
  }

  if (isMultiframe) {
    return processMultiframe(instances);
  } else {
    return processSingleframe(instances);
  }
}

/**
 * Process reconstructable multiframes checks
 * TODO: deal with multriframe checks! return false for now as can't reconstruct.
 * *
 * @returns {Object} value and reconstructionIssues.
 */
function processMultiframe(instances) {
  const value = {
    isReconstructable: false,
    reconstructionIssues: [],
  };
  const { metadata } = instances[0].getData();
  // enable for NM image
  const imageType = metadata.ImageType;
  const supportedNMImage = imageType[3] && imageType[2] === 'RECON TOMO';
  if (
    // Exclude NM modality with "RECON TOMO" type
    metadata.SOPClassUID === '1.2.840.10008.5.1.4.1.1.20' &&
    metadata.NumberOfFrames > 2 &&
    supportedNMImage
  ) {
    value.isReconstructable = true;
  } else {
    value.reconstructionIssues.push(ReconstructionIssues.MULTIFRAMES);
  }

  return value;
}

/**
 * Process reconstructable single frame checks
 *
 * @param {Object[]} An array of `OHIFInstanceMetadata` objects.
 *
 * @returns {Object} value and reconstructionIssues.
 */
function processSingleframe(instances) {
  const n = instances.length;
  const firstImage = instances[0].getData().metadata;
  const firstImageRows = firstImage.Rows;
  const firstImageColumns = firstImage.Columns;
  const firstImageSamplesPerPixel = firstImage.SamplesPerPixel;
  const firstImageOrientationPatient = firstImage.ImageOrientationPatient;

  const reconstructionIssues = [];
  // Can't reconstruct if we:
  // -- Have a different dimensions within a displaySet.
  // -- Have a different number of components within a displaySet.
  // -- Have different orientations within a displaySet.
  for (let ii = 1; ii < n; ++ii) {
    const instance = instances[ii].getData().metadata;
    const {
      Rows,
      Columns,
      SamplesPerPixel,
      ImageOrientationPatient,
    } = instance;

    if (Rows !== firstImageRows || Columns !== firstImageColumns) {
      reconstructionIssues.push(ReconstructionIssues.VARYING_IMAGESDIMENSIONS);
    } else if (SamplesPerPixel !== firstImageSamplesPerPixel) {
      reconstructionIssues.push(ReconstructionIssues.VARYING_IMAGESCOMPONENTS);
    } else if (
      !_isSameArray(ImageOrientationPatient, firstImageOrientationPatient)
    ) {
      reconstructionIssues.push(ReconstructionIssues.VARYING_IMAGESORIENTATION);
    }

    if (reconstructionIssues.length !== 0) {
      break;
    }
  }

  // check if dataset is 4D
  // numberOfImagesets = number of images for each set in 4D images
  // const { is4D, numberOfImagesPerSubset } = _isDataset4D(instances);
  // if (is4D) {
  //   reconstructionIssues.push(ReconstructionIssues.DATASET_4D);
  // }

  return {
    isReconstructable: reconstructionIssues.length === 0,
    reconstructionIssues,
  };
}

/**
 *  Check is the spacing is uniform.
 *  The input metadata array has to be ordered by image position.
 *
 * @param instances {Object[]} An array of `OHIFInstanceMetadata` objects.
 * @param datasetIs4D {boolean} is the dataset 4D.
 *
 * @returns {Object} isUniform, reconstructionIssues and missingFrames
 */
function isSpacingUniform(instances, datasetIs4D) {
  const n = instances.length;
  const firstImage = instances[0].getData().metadata;
  const firstImagePositionPatient = firstImage.ImagePositionPatient;
  const firstInstanceNumber = parseInt(
    firstImage.InstanceNumber ? firstImage.InstanceNumber : 0
  );

  const reconstructionIssues = [];
  let missingFrames = 0;

  // Check if frame spacing is approximately equal within a spacingTolerance.
  // If spacing is on a uniform grid but we are missing frames,
  // Allow reconstruction, but pass back the number of missing frames.
  if (n > 2) {
    const lastIpp = instances[n - 1].getData().metadata.ImagePositionPatient;

    // We can't reconstruct if we are missing ImagePositionPatient values
    if (firstImagePositionPatient && lastIpp) {
      const averageSpacingBetweenFrames =
        _getPerpendicularDistance(firstImagePositionPatient, lastIpp) / (n - 1);

      let previousImagePositionPatient = firstImagePositionPatient;
      let previousInstanceNumber = firstInstanceNumber;

      for (let ii = 1; ii < n; ++ii) {
        const instance = instances[ii].getData().metadata;
        const { ImagePositionPatient } = instance;
        const instanceNumber = parseInt(
          instance.InstanceNumber ? instance.InstanceNumber : 0
        );

        const spacingBetweenFrames = _getPerpendicularDistance(
          ImagePositionPatient,
          previousImagePositionPatient
        );

        if (datasetIs4D && spacingBetweenFrames < 1e-3) {
          // the dataset is 4D, if the distance is zero, means that we are
          // checking the 4th dimension. Do not return, since we want still to
          // check the 3rd dimension spacing.
          continue;
        }

        const instanceNumberDiff = Math.abs(
          instanceNumber - previousInstanceNumber
        );

        const spacingIssue = _getSpacingIssue(
          instanceNumberDiff,
          spacingBetweenFrames,
          averageSpacingBetweenFrames
        );

        if (spacingIssue) {
          const issue = spacingIssue.issue;

          if (issue === ReconstructionIssues.MISSING_FRAMES) {
            missingFrames += spacingIssue.missingFrames;
          } else if (issue === ReconstructionIssues.IRREGULAR_SPACING) {
            reconstructionIssues.push(issue);
            break;
          }
        }

        previousImagePositionPatient = ImagePositionPatient;
        previousInstanceNumber = instanceNumber;
      }
    }
  }

  return {
    isUniform: reconstructionIssues.length === 0,
    missingFrames,
    reconstructionIssues,
  };
}

/**
 *  Check if 4D dataset.
 *
 *  Assuming that slices at different time have the same position, here we just check if
 *  there are multiple slices for the same ImagePositionPatient and disable MPR.
 *
 *  A better heuristic would be checking 4D tags, e.g. the presence of multiple TemporalPositionIdentifier values.
 *  However, some studies (e.g. https://github.com/OHIF/Viewers/issues/2113) do not have such tags.
 *
 * @param {Object[]} instances An array of `OHIFInstanceMetadata` objects.
 *
 * @returns {{numberOfImagesPerSubset: number, is4D: boolean}} dataset4D value.
 */
function _isDataset4D(instances) {
  let is4D = false;
  let numberOfImagesPerSubset = instances.length;
  const n = instances.length;
  for (let ii = 0; ii < n; ++ii) {
    const instanceMetadataControl = instances[ii].getData().metadata;
    if (
      !instanceMetadataControl ||
      instanceMetadataControl === undefined ||
      !instanceMetadataControl.ImagePositionPatient ||
      instanceMetadataControl.ImagePositionPatient === undefined
    ) {
      continue;
    }
    for (let jj = ii + 1; jj < n; ++jj) {
      const instanceMetadata = instances[jj].getData().metadata;
      if (
        !instanceMetadata ||
        instanceMetadata === undefined ||
        !instanceMetadata.ImagePositionPatient ||
        instanceMetadata.ImagePositionPatient === undefined
      ) {
        continue;
      }

      if (
        _isSameArray(
          instanceMetadataControl.ImagePositionPatient,
          instanceMetadata.ImagePositionPatient
        )
      ) {
        numberOfImagesPerSubset = jj;
        is4D = true;
        break;
      }
    }
    if (is4D) {
      break;
    }
  }

  return { is4D, numberOfImagesPerSubset };
}

function _isSameArray(iop1, iop2) {
  if (iop1 === undefined || !iop2 === undefined) {
    return;
  }

  return (
    Math.abs(iop1[0] - iop2[0]) < iopTolerance &&
    Math.abs(iop1[1] - iop2[1]) < iopTolerance &&
    Math.abs(iop1[2] - iop2[2]) < iopTolerance
  );
}

// TODO: Is 10% a reasonable spacingTolerance for spacing?
const spacingTolerance = 0.1;
const iopTolerance = 0.01;

/**
 * Checks for spacing issues.
 *
 * @param {number} instanceNumberDiff the difference in InstantNumber
 * @param {number} spacing The spacing between two frames.
 * @param {number} averageSpacing The average spacing between all frames.
 *
 * @returns {Object} An object containing the issue and extra information if necessary.
 */
function _getSpacingIssue(instanceNumberDiff, spacing, averageSpacing) {
  const equalWithinTolerance =
    Math.abs(spacing - averageSpacing) < averageSpacing * spacingTolerance;

  if (equalWithinTolerance) {
    return;
  }

  if (instanceNumberDiff === 1) {
    return { issue: ReconstructionIssues.IRREGULAR_SPACING };
  }

  const multipleOfAverageSpacing = spacing / averageSpacing;

  const numberOfSpacings = Math.round(multipleOfAverageSpacing);

  const errorForEachSpacing =
    Math.abs(spacing - numberOfSpacings * averageSpacing) / numberOfSpacings;

  if (errorForEachSpacing < spacingTolerance * averageSpacing) {
    return {
      issue: ReconstructionIssues.MISSING_FRAMES,
      missingFrames: numberOfSpacings - 1,
    };
  }

  return { issue: ReconstructionIssues.IRREGULAR_SPACING };
}

function _getPerpendicularDistance(a, b) {
  return Math.sqrt(
    Math.pow(a[0] - b[0], 2) +
      Math.pow(a[1] - b[1], 2) +
      Math.pow(a[2] - b[2], 2)
  );
}

const constructableModalities = ['MR', 'CT', 'PT', 'NM'];

export { isDisplaySetReconstructable, isSpacingUniform };
