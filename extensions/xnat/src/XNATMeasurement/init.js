import cornerstone from 'cornerstone-core';
import { addTool, EVENTS as CS_EVENTS } from 'cornerstone-tools';
import throttle from 'lodash.throttle';
import { XNATToolTypes } from './measurement-tools';
import { handleMeasurementContextMenu } from './components';
import { xnatMeasurementApi } from './api';
import { xnatAnnotationTools } from './measurement-tools';

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
  // add XNAT annotation tools to CS Tools
  Object.values(xnatAnnotationTools).forEach(addTool);

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
      CS_EVENTS.MEASUREMENT_ADDED,
      onMeasurementAdded
    );
    element.addEventListener(
      CS_EVENTS.MEASUREMENT_REMOVED,
      onMeasurementRemoved
    );
    element.addEventListener(
      CS_EVENTS.MEASUREMENT_MODIFIED,
      onMeasurementModified
    );
    element.addEventListener(
      CS_EVENTS.MEASUREMENT_COMPLETED,
      onMeasurementCompleted
    );

    // element.addEventListener(CS_EVENTS.TOUCH_PRESS, onTouchPress);
    // element.addEventListener(CS_EVENTS.MOUSE_CLICK, handleClick);
    // element.addEventListener(CS_EVENTS.TOUCH_START, onTouchStart);

    // TODO: This makes scrolling painfully slow
    // element.addEventListener(cornerstone.EVENTS.NEW_IMAGE, onNewImage);
  }

  function elementDisabledHandler(evt) {
    const element = evt.detail.element;

    element.removeEventListener(
      CS_EVENTS.MEASUREMENT_ADDED,
      onMeasurementAdded
    );
    element.removeEventListener(
      CS_EVENTS.MEASUREMENT_REMOVED,
      onMeasurementRemoved
    );
    element.removeEventListener(
      CS_EVENTS.MEASUREMENT_MODIFIED,
      onMeasurementModified
    );
    element.removeEventListener(
      CS_EVENTS.MEASUREMENT_COMPLETED,
      onMeasurementCompleted
    );
    // element.removeEventListener(
    //   CS_EVENTS.LABELMAP_MODIFIED,
    //   onLabelmapModified
    // );

    // element.removeEventListener(CS_EVENTS.TOUCH_PRESS, onTouchPress);
    // element.removeEventListener(CS_EVENTS.MOUSE_CLICK, handleClick);
    // element.removeEventListener(CS_EVENTS.TOUCH_START, onTouchStart);

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
      tools: [...Object.values(XNATToolTypes)],
      contextMenuCallback: handleMeasurementContextMenu,
      dialogIds: ['context-menu', 'labelling'],
    },
    'ACTIVE_VIEWPORT::CORNERSTONE'
  );
}
