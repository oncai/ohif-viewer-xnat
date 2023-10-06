import cornerstone from 'cornerstone-core';

const resetViewport = enabledElement => {
  const element = enabledElement.element;
  const canvas = enabledElement.canvas;
  const layers = enabledElement.layers || [];

  if (layers && layers.length) {
    layers.forEach(layer => {
      const image = layer.image;

      if (!image) {
        layer.viewport = undefined;
        return;
      }

      const defaultViewport = cornerstone.getDefaultViewport(canvas, image);
      if (layer.options && layer.options.viewport) {
        layer.viewport = Object.assign(defaultViewport, layer.options.viewport);
      } else {
        layer.viewport = defaultViewport;
      }

      if (enabledElement.activeLayerId === layer.layerId) {
        enabledElement.viewport = layer.viewport;
      }
    });

    cornerstone.updateImage(element);
  } else {
    cornerstone.reset(element);
  }
};

export default resetViewport;
