const calculateContourRoiVolume = (areas, sliceSpacing) => {
  let totalArea = 0;

  areas.forEach(area => (totalArea += area));

  const volumeCm3 = totalArea * sliceSpacing * 0.001;

  return parseFloat(volumeCm3.toFixed(3));
};

export default calculateContourRoiVolume;
