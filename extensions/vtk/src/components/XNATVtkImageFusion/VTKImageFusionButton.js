import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import OHIF from '@ohif/core';
import { ToolbarButton } from '@ohif/ui';
import ConnectedVTKImageFusionDialog from './ConnectedVTKImageFusionDialog';
import volumeProperties from '../../utils/volumeProperties';

const { setViewportSpecificData } = OHIF.redux.actions;
const DIALOG_ID = 'VTK_COMPOSITE_IMAGE_DIALOG_ID';

class VTKImageFusionButton extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      isActive: false,
    };

    this.toggleActive = this.toggleActive.bind(this);
  }

  componentWillUnmount() {
    const { UIDialogService } = this.props.servicesManager.services;
    UIDialogService.dismiss({ id: DIALOG_ID });

    // Empty vtkImageFusionData in store
    const action = setViewportSpecificData(0, {
      vtkImageFusionData: undefined,
    });
    window.store.dispatch(action);
  }

  toggleActive() {
    const { commandsManager, servicesManager } = this.props;
    const { UIDialogService, UINotificationService } = servicesManager.services;

    const { isActive } = this.state;

    if (!isActive) {
      // Wait until the background image is fully loaded
      const viewports = window.store.getState().viewports;
      const displaySetInstanceUID =
        viewports.viewportSpecificData[0].displaySetInstanceUID;
      if (!volumeProperties.getProperties(displaySetInstanceUID)) {
        if (UINotificationService) {
          UINotificationService.show({
            title: 'Image Fusion',
            message: 'Please wait until the image is fully loaded.',
            type: 'info',
          });
        }
        return;
      }
    }

    if (isActive) {
      UIDialogService.dismiss({ id: DIALOG_ID });
    } else {
      const spacing = 20;
      const { x, y } = document
        .querySelector(`.ViewerMain`)
        .getBoundingClientRect();
      UIDialogService.create({
        id: DIALOG_ID,
        content: ConnectedVTKImageFusionDialog,
        contentProps: {
          onClose: this.toggleActive,
          commandsManager: commandsManager,
        },
        defaultPosition: {
          x: x + spacing || 0,
          y: y + spacing || 0,
        },
      });
    }

    this.setState({ isActive: !isActive });
  }

  render() {
    const { button } = this.props;
    const { id, label, icon } = button;
    const { isActive } = this.state;

    return (
      <React.Fragment>
        <ToolbarButton
          key={id}
          label={label}
          icon={icon}
          onClick={this.toggleActive}
          isActive={isActive}
        />
      </React.Fragment>
    );
  }
}

VTKImageFusionButton.propTypes = {
  parentContext: PropTypes.object.isRequired,
  toolbarClickCallback: PropTypes.func.isRequired,
  button: PropTypes.object.isRequired,
  activeButtons: PropTypes.array.isRequired,
  isActive: PropTypes.bool,
  servicesManager: PropTypes.object,
  commandsManager: PropTypes.object,
};

VTKImageFusionButton.defaultProps = {
};

export default VTKImageFusionButton;
