import cornerstone from 'cornerstone-core';

/*
          LOWER   UPPER
  LWF_PZ  0.038   0.152   x 100,000
*/

const id = 'limitLwfPz';

const buildColormapObject = () => {
  const data = {
    name: 'LIMIT LWF-PZ',
    numOfColors: 256,
    colors: [],
  };

  const colors = data.colors;
  colors[0] = [0, 0, 0, 0];
  colors[64] = [255, 0, 0, 255];
  colors[128] = [255, 255, 0, 255];
  colors[255] = [0, 255, 0, 255];

  const lowerTh = 3800;
  const upperTh = 15200;
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

const limitLwfPz = buildColormapObject();

export default limitLwfPz;
