import cloneDeep from 'lodash.clonedeep';
import cornerstone from 'cornerstone-core';
// Custom Colormaps
import limitLwfPz from './colormaps/limitLwfPz';
import limitLwfTz from './colormaps/limitLwfTz';

const customColormaps = {};

const buildCustomColormaps = () => {
  customColormaps[limitLwfPz.id] = limitLwfPz.colormap;
  customColormaps[limitLwfTz.id] = limitLwfTz.colormap;
};

buildCustomColormaps();

const colormapList = cornerstone.colors.getColormapsList();

/**
 *
 * @param {string} id: Colormap id
 * @returns {string|Object}
 */
const getColormap = id => {
  if (customColormaps.hasOwnProperty(id)) {
    return cloneDeep(customColormaps[id]);
  }

  return id;
};

export { colormapList, getColormap };
