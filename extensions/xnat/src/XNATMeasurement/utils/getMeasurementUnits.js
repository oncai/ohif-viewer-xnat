import cornerstone from 'cornerstone-core';

const getMeasurementUnits = (imageId, modality) => {
  let spatialUnit = 'px';

  const imagePlane = cornerstone.metaData.get('imagePlaneModule', imageId);

  if (imagePlane.rowPixelSpacing || imagePlane.rowImagePixelSpacing) {
    spatialUnit = 'mm';
  }

  return {
    spatialUnit,
    areaUnit: spatialUnit + String.fromCharCode(178),
    angleUnit: String.fromCharCode(parseInt('00B0', 16)),
    pixelUnit: modality === 'CT' ? 'HU' : '',
  };
};

export default getMeasurementUnits;
