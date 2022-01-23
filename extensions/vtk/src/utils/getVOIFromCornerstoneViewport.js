import cornerstone from 'cornerstone-core';
import { commandsManager } from '@ohif/viewer/src/App';

export default function getVOIFromCornerstoneViewport() {
  const dom = commandsManager.runCommand('getActiveViewportEnabledElement');
  const cornerstoneElement = cornerstone.getEnabledElement(dom);

  if (cornerstoneElement) {
    const imageId = cornerstoneElement.image.imageId;

    const Modality = cornerstone.metaData.get('Modality', imageId);

    if (Modality !== 'PT') {
      const { windowWidth, windowCenter } = cornerstoneElement.viewport.voi;

      return {
        windowWidth,
        windowCenter,
      };
    }
  }
}
