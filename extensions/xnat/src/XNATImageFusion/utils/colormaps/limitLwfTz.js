import cornerstone from 'cornerstone-core';

/*
          LOWER     UPPER
  LWF_PZ  0.0228    0.0912   x 100,000
*/

const id = 'limitLwfTz';

const buildColormapObject = () => {
  const data = {
    name: 'LIMIT LWF-TZ',
    numOfColors: 256,
    colors: [],
  };

  const colors = data.colors;
  colors[0] = [0, 0, 0, 0];
  colors[64] = [255, 0, 0, 255];
  colors[128] = [255, 255, 0, 255];
  colors[255] = [0, 255, 0, 255];

  const lowerTh = 2280;
  const upperTh = 9120;
  const voiLUT = {
    firstValueMapped: 1,
    numBitsPerEntry: 8,
    lut: [0],
  };

  const lut = voiLUT.lut;
  for (let i = 1; i <= upperTh + 1; i++) {
    if (i < lowerTh) {
      lut[i] = 64;
    } else if (i > upperTh) {
      lut[i] = 255;
    } else {
      lut[i] = 128;
    }
  }

  const colormap = cornerstone.colors.getColormap(id, data);
  colormap.voiLUT = voiLUT;

  return { id, colormap };
};

const limitLwfTz = buildColormapObject();

export default limitLwfTz;
