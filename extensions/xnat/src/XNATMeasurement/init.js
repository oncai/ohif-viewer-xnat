import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import throttle from 'lodash.throttle';
import { toolTypes } from './measurement-tools';
import { handleMeasurementContextMenu } from './components';
import { xnatMeasurementApi } from './api';

const MEASUREMENT_ACTION_MAP = {
  added: event => {
    //xnatMeasurementApi.onMeasurementAdded(event);
  },
  modified: throttle(event => {
    xnatMeasurementApi.onMeasurementModified(event);
  }, 300),
  removed: event => {
    xnatMeasurementApi.onMeasurementRemoved(event);
  },
  completed: event => {
    xnatMeasurementApi.onMeasurementCompleted(event);
  },
};

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
  // TODO: MEASUREMENT_COMPLETED (not present in initial implementation)
  const onMeasurementsChanged = (action, event) => {
    return MEASUREMENT_ACTION_MAP[action](event);
  };
  const onMeasurementAdded = onMeasurementsChanged.bind(this, 'added');
  const onMeasurementRemoved = onMeasurementsChanged.bind(this, 'removed');
  const onMeasurementModified = onMeasurementsChanged.bind(this, 'modified');
  const onMeasurementCompleted = onMeasurementsChanged.bind(this, 'completed');

  function elementEnabledHandler(evt) {
    const element = evt.detail.element;

    element.addEventListener(
      csTools.EVENTS.MEASUREMENT_ADDED,
      onMeasurementAdded
    );
    element.addEventListener(
      csTools.EVENTS.MEASUREMENT_REMOVED,
      onMeasurementRemoved
    );
    element.addEventListener(
      csTools.EVENTS.MEASUREMENT_MODIFIED,
      onMeasurementModified
    );
    element.addEventListener(
      csTools.EVENTS.MEASUREMENT_COMPLETED,
      onMeasurementCompleted
    );

    // element.addEventListener(
    //   csTools.EVENTS.LABELMAP_MODIFIED,
    //   onLabelmapModified
    // );

    // element.addEventListener(csTools.EVENTS.TOUCH_PRESS, onTouchPress);
    // element.addEventListener(csTools.EVENTS.MOUSE_CLICK, handleClick);
    // element.addEventListener(csTools.EVENTS.TOUCH_START, onTouchStart);

    // TODO: This makes scrolling painfully slow
    // element.addEventListener(cornerstone.EVENTS.NEW_IMAGE, onNewImage);
  }

  function elementDisabledHandler(evt) {
    const element = evt.detail.element;

    element.removeEventListener(
      csTools.EVENTS.MEASUREMENT_ADDED,
      onMeasurementAdded
    );
    element.removeEventListener(
      csTools.EVENTS.MEASUREMENT_REMOVED,
      onMeasurementRemoved
    );
    element.removeEventListener(
      csTools.EVENTS.MEASUREMENT_MODIFIED,
      onMeasurementModified
    );
    element.removeEventListener(
      csTools.EVENTS.MEASUREMENT_COMPLETED,
      onMeasurementCompleted
    );
    // element.removeEventListener(
    //   csTools.EVENTS.LABELMAP_MODIFIED,
    //   onLabelmapModified
    // );

    // element.removeEventListener(csTools.EVENTS.TOUCH_PRESS, onTouchPress);
    // element.removeEventListener(csTools.EVENTS.MOUSE_CLICK, handleClick);
    // element.removeEventListener(csTools.EVENTS.TOUCH_START, onTouchStart);

    // TODO: This makes scrolling painfully slow
    // element.removeEventListener(cornerstone.EVENTS.NEW_IMAGE, onNewImage);
  }

  cornerstone.events.addEventListener(
    cornerstone.EVENTS.ELEMENT_ENABLED,
    elementEnabledHandler
  );
  cornerstone.events.addEventListener(
    cornerstone.EVENTS.ELEMENT_DISABLED,
    elementDisabledHandler
  );

  // subscribe to context menu handler
  commandsManager.runCommand(
    'subscribeToContextMenuHandler',
    {
      tools: [...toolTypes],
      contextMenuCallback: handleMeasurementContextMenu,
      dialogIds: ['context-menu', 'labelling'],
    },
    'ACTIVE_VIEWPORT::CORNERSTONE'
  );
}
