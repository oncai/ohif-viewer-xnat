import { ContextMenu } from '@ohif/ui';
import PropTypes from 'prop-types';
import csTools from 'cornerstone-tools';
import React from 'react';
import { commandsManager } from '@ohif/viewer/src/App';
import TOOL_NAMES from '../../peppermint-tools/toolNames';

const toolType = TOOL_NAMES.FREEHAND_ROI_3D_TOOL;

const modules = csTools.store.modules;

const XNATContextMenu =
  ({ eventData,
     onClose,
     onDelete,
     onCopy,
     OnPaste,
     onEmpty
  }) => {
  const contourDropdownItems = [
    {
      label: 'Delete',
      actionType: 'Delete',
      action: ({ nearbyToolData, eventData }) =>
        onDelete(nearbyToolData, eventData),
    },
    {
      label: 'Copy contour',
      actionType: 'Copy',
      action: ({ nearbyToolData, eventData }) =>
        onCopy(nearbyToolData, eventData),
    },
  ];

  const nonContourDropdownItems = [
    {
      label: 'Paste contour',
      actionType: 'Paste',
      action: ({ eventData }) =>
        OnPaste(eventData),
    },
    {
      label: 'Empty clipboard',
      actionType: 'Empty',
      action: ({ }) =>
        onEmpty(),
    },
  ];

  const getDropdownItems = eventData => {
    let dropdownItems = [];

    const elementTool = csTools.getToolForElement(
      eventData.element,
      toolType
    );

    // debugger;

    if (elementTool) {
      if (elementTool.mode === 'active') {
        const nearbyToolData = commandsManager.runCommand('getNearbyToolData', {
          element: eventData.element,
          canvasCoordinates: eventData.currentPoints.canvas,
          availableToolTypes: [toolType],
        });

        if (nearbyToolData) {
          contourDropdownItems.forEach(item => {
            item.params = { eventData, nearbyToolData };
            dropdownItems.push(item);
          });
        } else {
          const module = modules.freehand3D;
          if (module.clipboard.data) {
            nonContourDropdownItems.forEach(item => {
              item.params = { eventData, nearbyToolData };
              dropdownItems.push(item);
            });
          }
        }
      }
    }

    return dropdownItems;
  };

  const onClickHandler = ({ action, params }) => {
    action(params);
    if (onClose) {
      onClose();
    }
  };

  const dropdownItems = getDropdownItems(eventData);

  return (
    <div className="ToolContextMenu">
      <ContextMenu items={dropdownItems} onClick={onClickHandler} />
    </div>
  );
};

XNATContextMenu.propTypes = {
  eventData: PropTypes.object,
  onClose: PropTypes.func,
  onDelete: PropTypes.func,
  onCopy: PropTypes.func,
  onPaste: PropTypes.func,
  onEmpty: PropTypes.func,
};

export default XNATContextMenu;
