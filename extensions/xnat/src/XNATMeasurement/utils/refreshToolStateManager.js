import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';

const { getToolForElement, setToolPassiveForElement } = csTools;

const refreshToolStateManager = toolTypes => {
  cornerstone.getEnabledElements().forEach(enabledElement => {
    const { element, viewport } = enabledElement;
    const showAnnotations = viewport.hasOwnProperty('showAnnotations')
      ? viewport.showAnnotations
      : true;

    if (!showAnnotations) {
      return;
    }

    toolTypes.forEach(toolType => {
      const tool = getToolForElement(element, toolType);

      if (tool.mode !== 'active' && tool.mode !== 'passive') {
        // If not already active or passive, set passive so measurements render.
        setToolPassiveForElement(element, toolType);
      }
    });

    cornerstone.updateImage(element);
  });
};

export default refreshToolStateManager;
