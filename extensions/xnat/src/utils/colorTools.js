const componentToHex = c => {
  let hex = c.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
};

const rgbToHex = (rgbString, delimiter) => {
  let colorHex;
  try {
    const rgb = rgbString.split(delimiter).map(c => Number(c));
    colorHex = `#${componentToHex(rgb[0])}${componentToHex(rgb[1])}${componentToHex(rgb[2])}`;
  } catch (err) {
    console.error(`Error parsing color: ${rgbString}`);
    colorHex = '#000000';
  }
  return colorHex;
};

const colorTools = {
  rgbToHex: rgbToHex,
};

export default colorTools;
