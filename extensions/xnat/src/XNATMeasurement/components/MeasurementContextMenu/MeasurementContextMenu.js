import React from 'react';
import PropTypes from 'prop-types';
import { ContextMenu } from '@ohif/ui';

const MeasurementContextMenu = ({
  onSetLabel,
  onSetDescription,
  isTouchEvent,
  eventData,
  callbackData,
  onClose,
  onDelete,
}) => {
  const defaultDropdownItems = [
    {
      label: 'Delete measurement',
      actionType: 'Delete',
      action: ({ nearbyToolData, eventData }) =>
        onDelete(nearbyToolData, eventData),
    },
    // {
    //   label: 'Relabel',
    //   actionType: 'setLabel',
    //   action: ({ nearbyToolData, eventData }) => {
    //     const { tool: measurementData } = nearbyToolData;
    //     onSetLabel(eventData, measurementData);
    //   },
    // },
    // {
    //   actionType: 'setDescription',
    //   action: ({ nearbyToolData, eventData }) => {
    //     const { tool: measurementData } = nearbyToolData;
    //     onSetDescription(eventData, measurementData);
    //   },
    // },
  ];

  const getDropdownItems = (eventData, isTouchEvent = false) => {
    const nearbyToolData = callbackData.nearbyToolData;

    /*
     * Annotate tools for touch events already have a press handle to edit it,
     * has a better UX for deleting it.
     */
    if (
      isTouchEvent &&
      nearbyToolData //&&
      //nearbyToolData.toolType === 'arrowAnnotate'
    ) {
      return;
    }

    let dropdownItems = [];
    if (nearbyToolData) {
      defaultDropdownItems.forEach(item => {
        item.params = { eventData, nearbyToolData };

        if (item.actionType === 'setDescription') {
          item.label = `${
            nearbyToolData.tool.description ? 'Edit' : 'Add'
          } Description`;
        }

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

  const dropdownItems = getDropdownItems(eventData, isTouchEvent);

  return (
    <div className="ToolContextMenu">
      <ContextMenu items={dropdownItems} onClick={onClickHandler} />
    </div>
  );
};

MeasurementContextMenu.propTypes = {
  isTouchEvent: PropTypes.bool.isRequired,
  eventData: PropTypes.object,
  callbackData: PropTypes.object,
  onClose: PropTypes.func,
  onSetDescription: PropTypes.func,
  onSetLabel: PropTypes.func,
  onDelete: PropTypes.func,
};

MeasurementContextMenu.defaultProps = {
  isTouchEvent: false,
};

export { MeasurementContextMenu };
