import cornerstone from 'cornerstone-core';
// Custom Colormaps
import colormapsRequiringFalseColorImage from './falseImageDataColormaps';

const falseColorImageMaps = colormapsRequiringFalseColorImage;

const colormapList = [
  {
    description: 'Generic colormaps',
    colormaps: cornerstone.colors.getColormapsList(),
  },
  {
    description: 'Project-specific colormaps',
    colormaps: Object.keys(falseColorImageMaps).map(key => {
      const colormap = falseColorImageMaps[key];
      return { id: colormap.id, name: colormap.name };
    }),
  },
];

/**
 *
 * @param {string} id: Colormap id
 * @returns {string|Object}
 */
const getColormap = id => {
  if (falseColorImageMaps.hasOwnProperty(id)) {
    return falseColorImageMaps[id];
  }

  return id;
};

export { colormapList, getColormap };
