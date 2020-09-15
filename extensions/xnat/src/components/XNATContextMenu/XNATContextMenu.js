import { ContextMenu } from '@ohif/ui';
import PropTypes from 'prop-types';
import React from 'react';
import { commandsManager } from '@ohif/viewer/src/App';
import TOOL_NAMES from '../../peppermint-tools/toolNames';

const toolTypes = [TOOL_NAMES.FREEHAND_ROI_3D_TOOL];

const XNATContextMenu = ({ eventData, onClose, onDelete }) => {
  const defaultDropdownItems = [
    {
      label: 'Delete',
      actionType: 'Delete',
      action: ({ nearbyToolData, eventData }) =>
        onDelete(nearbyToolData, eventData),
    },
  ];

  const getDropdownItems = eventData => {
    const nearbyToolData = commandsManager.runCommand('getNearbyToolData', {
      element: eventData.element,
      canvasCoordinates: eventData.currentPoints.canvas,
      availableToolTypes: toolTypes,
    });

    let dropdownItems = [];
    if (nearbyToolData) {
      defaultDropdownItems.forEach(item => {
        item.params = { eventData, nearbyToolData };
        dropdownItems.push(item);
      });
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
};

export default XNATContextMenu;
