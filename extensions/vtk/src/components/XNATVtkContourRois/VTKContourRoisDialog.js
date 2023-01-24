import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import OHIF from '@ohif/core';

import './VTKContourRoisDialog.styl';
import { Icon } from '@ohif/ui';

class VTKContourRoisDialog extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      // ROI data
      displaySetInstanceUID: 'none',
      isLoading: false,
    };
  }

  componentDidMount() {
  }

  componentDidUpdate(prevProps, prevState) {
  }

  render() {
    const {
      isLoading,
    } = this.state;

    let className = 'VTKContourRoisDialogContainer';
    if (isLoading) {
      className += ' isLoading';
    }

    return (
      <div className={className}>
        <div className="VTKContourRoisDialog">
          <div className="header">
            <Icon name="xnat-contour" />
          </div>
          ROIs list
        </div>
      </div>
    );
  }
}

VTKContourRoisDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  viewportSpecificData: PropTypes.object.isRequired,
  activeViewportIndex: PropTypes.number.isRequired,
  setViewportContourRoisData: PropTypes.func.isRequired,
  commandsManager: PropTypes.object,
};

export default VTKContourRoisDialog;
