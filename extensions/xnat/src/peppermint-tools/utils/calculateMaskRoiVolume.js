const calculateMaskRoiVolume = (labelmap3D, segmentIndex, voxelScaling) => {
  const labelmaps2D = labelmap3D.labelmaps2D;
  let totalVoxels = 0;

  labelmaps2D.forEach(labelmap2D => {
    if (labelmap2D && labelmap2D.segmentsOnLabelmap.includes(segmentIndex)) {
      totalVoxels += labelmap2D.pixelData.filter(
        voxel => voxel === segmentIndex
      ).length;
    }
  });

  const volumeCm3 = totalVoxels * voxelScaling * 0.001;

  return parseFloat(volumeCm3.toFixed(3));
};

export default calculateMaskRoiVolume;
