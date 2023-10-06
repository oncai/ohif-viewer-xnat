import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import imageFusionManager from './api/ImageFusionManager';

/**
 * @export
 * @param {Object} servicesManager
 * @param commandsManager
 * @param {Object} configuration
 */
export default function init({
  servicesManager,
  commandsManager,
  configuration,
}) {
  function stackAddedHandler(evt) {
    const eventData = evt.detail;
    const { element, toolName } = eventData;

    if (toolName === 'stack') {
      const enabledElement = cornerstone.getEnabledElement(element);
      imageFusionManager.reset(enabledElement);
    }
  }

  function elementEnabledHandler(evt) {
    const element = evt.detail.element;

    element.addEventListener(
      csTools.EVENTS.MEASUREMENT_ADDED,
      stackAddedHandler
    );
  }

  function elementDisabledHandler(evt) {
    const element = evt.detail.element;

    element.removeEventListener(
      csTools.EVENTS.MEASUREMENT_ADDED,
      stackAddedHandler
    );
  }

  cornerstone.events.addEventListener(
    cornerstone.EVENTS.ELEMENT_ENABLED,
    elementEnabledHandler
  );
  cornerstone.events.addEventListener(
    cornerstone.EVENTS.ELEMENT_DISABLED,
    elementDisabledHandler
  );
}
