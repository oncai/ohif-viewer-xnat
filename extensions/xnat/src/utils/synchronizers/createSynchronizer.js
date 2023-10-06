import csTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';

const { getToolState } = csTools;

const createSynchronizer = (eventName, eventHandler) => {
  const synchronizer = new csTools.Synchronizer(eventName, eventHandler);
  synchronizer.displayImage = (element, image, viewport) => {
    const toolData = getToolState(element, 'stack');

    if (toolData && toolData.data && toolData.data.length > 1) {
      const stackRendererData = getToolState(element, 'stackRenderer');
      if (
        stackRendererData &&
        stackRendererData.data &&
        stackRendererData.data.length
      ) {
        const stackRenderer = stackRendererData.data[0];
        const stackData = toolData.data[0];
        stackRenderer.currentImageIdIndex = stackData.currentImageIdIndex;
        stackRenderer.render(element, toolData.data);
      }
    } else {
      cornerstone.displayImage(element, image, viewport);
    }
  };

  return synchronizer;
};

export default createSynchronizer;
