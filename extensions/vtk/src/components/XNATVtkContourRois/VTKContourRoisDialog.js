import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Icon, Range } from '@ohif/ui';
import { CONTOUR_ROI_EVENTS, contourRenderingApi } from '../../utils/contourRois';
import ContourRoiCollection from './ContourRoiCollection';

import './VTKContourRoisDialog.styl';

class VTKContourRoisDialog extends PureComponent {
  constructor(props) {
    super(props);

    this.updateLineThickness = this.updateLineThickness.bind(this);
    this.onRoiListUpdated = this.onRoiListUpdated.bind(this);

    this.state = {
      lineThickness: contourRenderingApi.getLineThickness(),
      collectionUids: contourRenderingApi.getCollectionUids(),
    };

    document.addEventListener(
      CONTOUR_ROI_EVENTS.MESH_PROGRESS,
      this.onRoiListUpdated
    );
  }

  componentWillUnmount() {
    document.removeEventListener(
      CONTOUR_ROI_EVENTS.MESH_PROGRESS,
      this.onRoiListUpdated
    );
  }

  onRoiListUpdated() {
    const collectionUids = contourRenderingApi.getCollectionUids();
    this.setState({ collectionUids });
  }

  updateLineThickness(evt) {
    const value = parseInt(evt.target.value);
    contourRenderingApi.updateLineThickness(value);

    this.setState({ lineThickness: value });
  }

  render() {
    const { lineThickness, collectionUids } = this.state;

    let content = <h5>No Contour ROIs are loaded</h5>;
    if (collectionUids.length > 0) {
      content = (
        <div>
          <div className="rangeContainer">
            <label htmlFor="range">Line Width</label>
            <Range
              showValue
              step={1}
              min={1}
              max={5}
              value={lineThickness}
              onChange={this.updateLineThickness}
            />
          </div>
          {collectionUids.map(uid => (
            <ContourRoiCollection key={uid} collectionUid={uid} />
          ))}
        </div>
      );
    }

    return (
      <div className="VTKContourRoisDialogContainer">
        <div className="VTKContourRoisDialog">
          <div className="dialogHeader">
            <Icon name="xnat-contour" />
          </div>
          <div>{content}</div>
        </div>
      </div>
    );
  }
}

VTKContourRoisDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  commandsManager: PropTypes.object,
};

export default VTKContourRoisDialog;
