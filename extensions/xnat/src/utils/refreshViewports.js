import cornerstone from 'cornerstone-core';

const refreshViewports = (excludedElement = undefined) => {
  cornerstone.getEnabledElements().forEach(enabledElement => {
    if (enabledElement.element === excludedElement) {
      return;
    }
    if (enabledElement.image) {
      cornerstone.updateImage(enabledElement.element);
    }
  });
};

export default refreshViewports;
