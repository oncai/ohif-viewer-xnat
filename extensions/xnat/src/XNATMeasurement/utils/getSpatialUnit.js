import cornerstone from 'cornerstone-core';

export default function getSpatialUnit(imageId) {
  const imagePlane = cornerstone.metaData.get('imagePlaneModule', imageId);

  if (imagePlane.rowPixelSpacing || imagePlane.rowImagePixelSpacing) {
    return 'mm';
  }

  return 'px';
}
