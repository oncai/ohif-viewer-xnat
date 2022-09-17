import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';

const { getToolForElement, setToolPassive } = csTools;

const refreshToolStateManager = toolTypes => {
  cornerstone.getEnabledElements().forEach(enabledElement => {
    const { element } = enabledElement;

    toolTypes.forEach(toolType => {
      const tool = getToolForElement(element, toolType);

      if (tool.mode !== 'active' && tool.mode !== 'passive') {
        // If not already active or passive, set passive so measurements render.
        setToolPassive(toolType);
      }
    });

    cornerstone.updateImage(element);
  });
};

export default refreshToolStateManager;
