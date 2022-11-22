/**
 * creates a displayedArea object containing default values for the image
 * @param {Image} image A Cornerstone Image Object
 * @returns {DisplayedArea} displayedArea object
 * @memberof Internal
 */
export default function(image) {
  if (image === undefined) {
    throw new Error('getDisplayedArea: parameter image must not be undefined');
  }

  return {
    tlhc: {
      x: 1,
      y: 1,
    },
    brhc: {
      x: image.columns,
      y: image.rows,
    },
    rowPixelSpacing:
      image.rowPixelSpacing === undefined ? 1 : image.rowPixelSpacing,
    columnPixelSpacing:
      image.columnPixelSpacing === undefined ? 1 : image.columnPixelSpacing,
    presentationSizeMode: 'NONE',
  };
}
