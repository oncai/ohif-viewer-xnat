const pixelDataToFalseColorData = (srcImage, vLutFunc, useRescale = false) => {
  if (srcImage.color && !srcImage.falseColor) {
    throw new Error('Image already has color');
  }

  const minPixelValue = srcImage.minPixelValue;
  const numPixels = srcImage.width * srcImage.height;
  const origPixelData = srcImage.getPixelData();

  const storedColorPixelData = new Uint8Array(numPixels * 4);

  let canvasImageDataIndex = 0;
  let storedPixelDataIndex = 0;
  let sp;
  let mapped;

  if (minPixelValue < 0) {
    while (storedPixelDataIndex < numPixels) {
      sp = origPixelData[storedPixelDataIndex++];
      mapped = vLutFunc(sp - minPixelValue);
      storedColorPixelData[canvasImageDataIndex++] = mapped[0]; // Red
      storedColorPixelData[canvasImageDataIndex++] = mapped[1]; // Green
      storedColorPixelData[canvasImageDataIndex++] = mapped[2]; // Blue
      storedColorPixelData[canvasImageDataIndex++] = mapped[3]; // Alpha
    }
  } else {
    while (storedPixelDataIndex < numPixels) {
      sp = origPixelData[storedPixelDataIndex++];
      mapped = vLutFunc(sp);
      storedColorPixelData[canvasImageDataIndex++] = mapped[0]; // Red
      storedColorPixelData[canvasImageDataIndex++] = mapped[1]; // Green
      storedColorPixelData[canvasImageDataIndex++] = mapped[2]; // Blue
      storedColorPixelData[canvasImageDataIndex++] = mapped[3]; // Alpha
    }
  }

  const image = { ...srcImage };
  image.color = true;
  image.rgba = true;
  image.cachedLut = undefined;
  image.render = undefined;
  image.slope = 1;
  image.intercept = 0;
  image.minPixelValue = 0;
  image.maxPixelValue = 255;
  image.windowWidth = 255;
  image.windowCenter = 128;
  image.getPixelData = () => storedColorPixelData;

  return image;
};

export default pixelDataToFalseColorData;
