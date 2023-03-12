import { getModule, getToolState } from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';

const segmentationModule = getModule('segmentation');

const calculateMaskRoi2DStats = (element, currentImageIdIndex) => {
  // Presuming we have a single lapelmap3D
  const activeLabelmapIndex = 0;

  if (!element) {
    return;
  }

  const labelmap3D = segmentationModule.getters.labelmap3D(
    element,
    activeLabelmapIndex
  );

  const metadata = labelmap3D.metadata;
  const labelmap2D = labelmap3D.labelmaps2D[currentImageIdIndex];
  if (!labelmap2D) {
    return;
  }

  const segmentIndices = labelmap2D.segmentsOnLabelmap.filter(s => s > 0);
  if (segmentIndices.length < 1) {
    return;
  }

  const enabledElement = cornerstone.getEnabledElement(element);
  const image = enabledElement.image;
  const { width, height, columnPixelSpacing, rowPixelSpacing } = image;
  const scaling = (columnPixelSpacing || 1) * (rowPixelSpacing || 1);
  const imagePixels = cornerstone.getPixels(element, 0, 0, width, height);
  const labelmapPixels = labelmap2D.pixelData;

  segmentIndices.forEach(segmentIndex => {
    if (Number(segmentIndex) === 0) {
      return;
    }

    const stats2D = metadata[segmentIndex].stats.stats2D;
    let imageStats = stats2D[currentImageIdIndex];
    if (!imageStats) {
      imageStats = { invalidated: true, data: {} };
      stats2D[currentImageIdIndex] = imageStats;
    } else if (!imageStats.invalidated) {
      // No need for re-calculations
      return;
    }
    let data = imageStats.data;
    const sp = imagePixels.filter(
      (_, index) => labelmapPixels[index] === segmentIndex
    );
    const count = sp.length;
    if (count === 0) {
      data = {
        area: 0.0,
        mean: 0.0,
        stdDev: 0.0,
      };
    } else {
      data.area = parseFloat((count * scaling).toFixed(2));
      const sum = sp.reduce((acc, curr) => acc + curr, 0);
      const mean = sum / count;
      data.mean = parseFloat(mean.toFixed(2));
      const sumSquared = sp
        .map(value => (value - mean) ** 2)
        .reduce((acc, curr) => acc + curr, 0);
      const variance = sumSquared / count;
      data.stdDev = parseFloat(Math.sqrt(variance).toFixed(2));
    }

    imageStats.invalidated = false;
  });
};

export default calculateMaskRoi2DStats;
