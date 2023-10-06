import pixelDataToFalseColorData from './pixelDataToFalseColorData';

/*
          LOWER     UPPER
  LWF_PZ  0.0255    0.1445   x 10,000
*/

const buildColormapObject = () => {
  const maxValueMapped = 10000; // maximum mapping value

  const lowerTh = 0.0255;
  const upperTh = 0.1445;

  const mappedLowerTh = Math.floor(lowerTh * maxValueMapped);
  const mappedUpperTh = Math.floor(upperTh * maxValueMapped);
  const scale = 512 / (mappedUpperTh - mappedLowerTh);

  const colors = [];
  colors[0] = [0, 0, 0, 0]; // TRANSPARENT
  colors[1] = [255, 0, 0, 255]; // RED
  colors[2] = [0, 255, 0, 255]; // GREEN

  const vLutFunc = sp => {
    if (sp === 0) {
      return colors[0];
    } else if (sp < mappedLowerTh) {
      return colors[1];
    } else if (sp > mappedUpperTh) {
      return colors[2];
    } else {
      const redScale = Math.floor(scale * (mappedUpperTh - sp));
      const red = Math.max(0, Math.min(redScale, 255));
      const greenScale = Math.floor(scale * (sp - mappedLowerTh));
      const green = Math.max(0, Math.min(greenScale, 255));
      return [red, green, 0, 255];
    }
  };

  return {
    id: 'limitLwfPz',
    name: 'LIMIT LWF-PZ',
    requiresFalseColorImage: true,
    vLutFunc,
    getFalseColorImage: srcImage =>
      pixelDataToFalseColorData(srcImage, vLutFunc),
  };
};

const limitLwfPz = buildColormapObject();

export default limitLwfPz;
