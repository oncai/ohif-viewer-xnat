const getRoiMeasurementUnits = (modality, rowPixelSpacing) => {
  let spatialUnit = 'px';
  let spatialUnitCm = 'px';

  if (rowPixelSpacing) {
    spatialUnit = 'mm';
    spatialUnitCm = 'cm';
  }

  return {
    spatialUnit,
    areaUnit: spatialUnit + String.fromCharCode(178),
    volumeUnitCm: `${spatialUnitCm}${String.fromCharCode(179)}`,
    pixelUnit: modality === 'CT' ? 'HU' : '',
  };
};

export default getRoiMeasurementUnits;
