import { commandsManager, servicesManager } from '@ohif/viewer/src/App';
import XNATContextMenu from './XNATContextMenu';

const _getDefaultPosition = event => ({
  x: (event && event.currentPoints.client.x) || 0,
  y: (event && event.currentPoints.client.y) || 0,
});

function handleRightClick(event) {
  const mouseUpEvent = event.detail.event;
  const isRightClick = mouseUpEvent.which === 3;

  const { UIDialogService } = servicesManager.services;
  if (!UIDialogService) {
    console.warn('Unable to show dialog; no UI Dialog Service available.');
    return;
  }
  UIDialogService.dismiss({ id: 'context-menu' });

  if (isRightClick) {
    UIDialogService.create({
      id: 'context-menu',
      isDraggable: false,
      preservePosition: false,
      defaultPosition: _getDefaultPosition(event.detail),
      content: XNATContextMenu,
      contentProps: {
        eventData: event.detail,
        onDelete: (nearbyToolData, eventData) => {
          const element = eventData.element;
          commandsManager.runCommand('xnatRemoveToolState', {
            element,
            toolType: nearbyToolData.toolType,
            tool: nearbyToolData.tool,
          });
        },
        onClose: () => UIDialogService.dismiss({ id: 'context-menu' }),
      },
    });
  }
}

export { handleRightClick };
