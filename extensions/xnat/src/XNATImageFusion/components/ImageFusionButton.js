import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ToolbarButton } from '@ohif/ui';
import ConnectedImageFusionDialog from './ConnectedImageFusionDialog';

const DIALOG_ID = 'COMPOSITE_IMAGE_DIALOG_ID';

class ImageFusionButton extends PureComponent {
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
  }

  toggleActive() {
    const { commandsManager, servicesManager } = this.props;
    const { UIDialogService, UINotificationService } = servicesManager.services;

    const { isActive } = this.state;

    if (isActive) {
      UIDialogService.dismiss({ id: DIALOG_ID });
    } else {
      const spacing = 20;
      const { x, y } = document
        .querySelector(`.ViewerMain`)
        .getBoundingClientRect();
      UIDialogService.create({
        id: DIALOG_ID,
        content: ConnectedImageFusionDialog,
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

ImageFusionButton.propTypes = {
  parentContext: PropTypes.object.isRequired,
  toolbarClickCallback: PropTypes.func.isRequired,
  button: PropTypes.object.isRequired,
  activeButtons: PropTypes.array.isRequired,
  isActive: PropTypes.bool,
  servicesManager: PropTypes.object,
  commandsManager: PropTypes.object,
};

ImageFusionButton.defaultProps = {
};

export default ImageFusionButton;
