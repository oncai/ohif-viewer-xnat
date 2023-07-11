import pixelDataToFalseColorData from './pixelDataToFalseColorData';

/*
          LOWER     UPPER
  LWF_TZ  0.0204    0.0816   x 10,000
*/

const buildColormapObject = () => {
  const maxValueMapped = 10000; // maximum mapping value

  const lowerTh = 0.0204;
  const upperTh = 0.0816;

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
    id: 'limitLwfTz',
    name: 'LIMIT LWF-TZ',
    requiresFalseColorImage: true,
    vLutFunc,
    getFalseColorImage: srcImage =>
      pixelDataToFalseColorData(srcImage, vLutFunc),
  };
};

const limitLwfTz = buildColormapObject();

export default limitLwfTz;
