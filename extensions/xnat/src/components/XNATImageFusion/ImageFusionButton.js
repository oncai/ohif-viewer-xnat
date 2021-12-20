import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ToolbarButton } from '@ohif/ui';
import ConnectedImageFusionDialog from './ConnectedImageFusionDialog';
import { commandsManager } from '@ohif/viewer/src/App';

const DIALOG_ID = 'COMPOSITE_IMAGE_DIALOG_ID';

class ImageFusionButton extends PureComponent {
  constructor(props) {
    super(props);

    this.dialog = props.parentContext.props.dialog;

    const viewports = window.store.getState().viewports;
    this.isVTK = viewports.layout.viewports[0].hasOwnProperty('vtk');

    // this.viewportSpecificData = viewports.viewportSpecificData[0];

    this.state = {
      isActive: false,
    };

    this.toggleActive = this.toggleActive.bind(this);
  }

  componentWillUnmount() {
    this.dialog.dismiss({ id: DIALOG_ID });
  }

  toggleActive() {
    if (this.isVTK) {
      // Wait until the background image is fully loaded
      const viewports = window.store.getState().viewports;
      const displaySetInstanceUID =
        viewports.viewportSpecificData[0].displaySetInstanceUID;
      if (
        !commandsManager.runCommand('getVolumeLoadedData', {
          displaySetInstanceUID,
        })
      ) {
        const servicesManager = window.ohif.app.servicesManager;
        const { UINotificationService } = servicesManager.services;
        if (UINotificationService) {
          UINotificationService.show({
            title: 'Image Fusion',
            message: 'Please wait until the background image is fully loaded.',
            type: 'info',
          });
        }
        return;
      }
    }

    const { isActive } = this.state;

    if (isActive) {
      this.dialog.dismiss({ id: DIALOG_ID });
    } else {
      const colormaps = commandsManager.runCommand('getColormaps');
      const spacing = 20;
      const { x, y } = document
        .querySelector(`.ViewerMain`)
        .getBoundingClientRect();
      this.dialog.create({
        id: DIALOG_ID,
        content: ConnectedImageFusionDialog,
        contentProps: {
          onClose: this.toggleActive,
          isVTK: this.isVTK,
          // viewportSpecificData: this.viewportSpecificData,
          colormaps: colormaps,
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

ImageFusionButton.propTypes = {
  parentContext: PropTypes.object.isRequired,
  toolbarClickCallback: PropTypes.func.isRequired,
  button: PropTypes.object.isRequired,
  activeButtons: PropTypes.array.isRequired,
  isActive: PropTypes.bool,
};

export default ImageFusionButton;
