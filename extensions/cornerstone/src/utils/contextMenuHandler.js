import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import { commandsManager, servicesManager } from '@ohif/viewer/src/App';

const subscribeList = [];
const dialogIdList = [];

function subscribe(tools, contextMenuCallback, dialogIds = []) {
  subscribeList.push({
    tools: tools,
    callback: contextMenuCallback,
  });

  dialogIds.forEach(id => {
    if (dialogIdList.indexOf(id) === -1) {
      dialogIdList.push(id);
    }
  });
}

function elementEnabledHandler(evt) {
  const element = evt.detail.element;
  element.addEventListener(csTools.EVENTS.MOUSE_CLICK, onMouseClick);
  element.addEventListener(csTools.EVENTS.TOUCH_PRESS, onTouchPress);
  element.addEventListener(csTools.EVENTS.TOUCH_START, onTouchStart);
}

function elementDisabledHandler(evt) {
  const element = evt.detail.element;
  element.removeEventListener(csTools.EVENTS.MOUSE_CLICK, onMouseClick);
  element.removeEventListener(csTools.EVENTS.TOUCH_PRESS, onTouchPress);
  element.removeEventListener(csTools.EVENTS.TOUCH_START, onTouchStart);
}

function init() {
  cornerstone.events.addEventListener(
    cornerstone.EVENTS.ELEMENT_ENABLED,
    elementEnabledHandler
  );
  cornerstone.events.addEventListener(
    cornerstone.EVENTS.ELEMENT_DISABLED,
    elementDisabledHandler
  );
}

function dismiss() {
  const { UIDialogService } = servicesManager.services;
  if (!UIDialogService) {
    console.warn('Unable to show dialog; no UI Dialog Service available.');
    return false;
  }

  // dismiss open context menus
  dialogIdList.forEach(dialogId => {
    UIDialogService.dismiss({ id: dialogId });
  });

  // dialog(s) dismissed successfully
  return true;
}

function showGeneralContextMenu(evt, callbackData) {
  // ToDo: implement a general context menu
  const subscriber = subscribeList.filter(subscriber => {
    return subscriber.tools.indexOf('FreehandRoi3DTool') >= 0;
  })[0];

  if (subscriber) {
    subscriber.callback(evt, callbackData);
  }
}

function invokeSubscriberCallback(evt, isTouchEvent = false) {
  const eventData = evt.detail;

  const callbackData = {
    nearbyToolData: undefined,
    isTouchEvent: isTouchEvent,
  };

  let subscriber;
  for (let i = 0; i < subscribeList.length; i++) {
    subscriber = subscribeList[i];
    callbackData.nearbyToolData = commandsManager.runCommand(
      'getNearbyToolData',
      {
        element: eventData.element,
        canvasCoordinates: eventData.currentPoints.canvas,
        availableToolTypes: subscriber.tools,
      }
    );

    if (callbackData.nearbyToolData !== undefined) break;
  }

  if (callbackData.nearbyToolData !== undefined) {
    subscriber.callback(evt, callbackData);
  } else {
    // when no nearByData is found, show the shared/general context menu
    showGeneralContextMenu(evt, callbackData);
  }
}

function onTouchPress(evt) {
  if (dismiss()) {
    invokeSubscriberCallback(evt);
  }
}

function onTouchStart(evt) {
  dismiss();
}

function onMouseClick(evt) {
  const eventData = evt.detail;
  const mouseUpEvent = eventData.event;
  const isRightClick = mouseUpEvent.which === 3;

  if (isRightClick) {
    if (dismiss()) {
      invokeSubscriberCallback(evt);
    }
  }
}

const contextMenuHandler = {
  subscribe,
  init,
  dismiss,
};

export default contextMenuHandler;
