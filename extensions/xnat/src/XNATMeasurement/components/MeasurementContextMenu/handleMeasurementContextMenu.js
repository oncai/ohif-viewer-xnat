import { commandsManager, servicesManager } from '@ohif/viewer/src/App';
import { MeasurementContextMenu } from './MeasurementContextMenu';

const _getDefaultPosition = event => ({
  x: (event && event.currentPoints.client.x) || 0,
  y: (event && event.currentPoints.client.y) || 0,
});

const handleMeasurementContextMenu = (event, callbackData) => {
  const { UIDialogService } = servicesManager.services;
  UIDialogService.dismiss({ id: 'context-menu' });
  UIDialogService.create({
    id: 'context-menu',
    isDraggable: false,
    preservePosition: false,
    defaultPosition: _getDefaultPosition(event.detail),
    content: MeasurementContextMenu,
    contentProps: {
      eventData: event.detail,
      callbackData: callbackData,
      isTouchEvent: callbackData.isTouchEvent,
      onDelete: (nearbyToolData, eventData) => {
        const element = eventData.element;
        const tool = callbackData.nearbyToolData.tool;
        if (tool.locked) {
          return;
        }
        commandsManager.runCommand('removeToolState', {
          element,
          toolType: callbackData.nearbyToolData.toolType,
          tool,
        });
      },
      onClose: () => UIDialogService.dismiss({ id: 'context-menu' }),
      // onSetLabel: (eventData, measurementData) => {
      //   showLabellingDialog(
      //     { centralize: true, isDraggable: false },
      //     { skipAddLabelButton: true, editLocation: true },
      //     measurementData
      //   );
      // },
      // onSetDescription: (eventData, measurementData) => {
      //   showLabellingDialog(
      //     { defaultPosition: _getDefaultPosition(eventData) },
      //     { editDescriptionOnDialog: true },
      //     measurementData
      //   );
      // },
    },
  });
};

export default handleMeasurementContextMenu;
