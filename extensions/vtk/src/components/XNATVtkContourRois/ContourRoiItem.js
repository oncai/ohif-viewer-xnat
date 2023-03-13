import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';
import {
  contourRenderingApi,
  CONTOUR_ROI_EVENTS,
} from '../../utils/contourRois';
import ColoredCircle from './ColoredCircle';
import ProgressColoredCircle from './ProgressColoredCircle';

export default class ContourRoiCollection extends React.Component {
  static propTypes = {
    roiUid: PropTypes.string.isRequired,
  };

  static defaultProps = {};

  constructor(props = {}) {
    super(props);

    this._roi = contourRenderingApi.getRoi(props.roiUid);
    const { isReconstructed, errorMessage } = this._roi.meshProps;

    this.state = {
      visible: this._roi.meshProps.visible,
      isReconstructed: isReconstructed,
      errorMessage: errorMessage,
    };

    this.onToggleVisibility = this.onToggleVisibility.bind(this);
    this.onRoiEventHandler = this.onRoiEventHandler.bind(this);

    document.addEventListener(
      CONTOUR_ROI_EVENTS.MESH_READY,
      this.onRoiEventHandler
    );
    document.addEventListener(
      CONTOUR_ROI_EVENTS.MESH_ERROR,
      this.onRoiEventHandler
    );
  }

  componentWillUnmount() {
    // Remove event listeners
    document.removeEventListener(
      CONTOUR_ROI_EVENTS.MESH_READY,
      this.onRoiEventHandler
    );
    document.removeEventListener(
      CONTOUR_ROI_EVENTS.MESH_ERROR,
      this.onRoiEventHandler
    );
  }

  onRoiEventHandler(evt) {
    const { uid } = this._roi;
    if (uid === evt.detail.uid) {
      const type = evt.type;
      if (type === CONTOUR_ROI_EVENTS.MESH_READY) {
        this.setState({ isReconstructed: true });
      } else if (type === CONTOUR_ROI_EVENTS.MESH_READY) {
        this.setState({ errorMessage: evt.detail.errorMessage });
      }
    }
  }

  onToggleVisibility(uid) {
    const { visible } = this.state;

    contourRenderingApi.ToggleRoiVisibility(uid);

    this.setState({ visible: !visible });
  }

  render() {
    const { visible, isReconstructed, errorMessage } = this.state;

    const { uid, name, color } = this._roi;

    let roiNumberContent = <ColoredCircle color={color} />;
    if (!isReconstructed && !errorMessage) {
      roiNumberContent = <ProgressColoredCircle uid={uid} />;
    }

    let toggleVisibilityConetent = null;
    if (errorMessage) {
      toggleVisibilityConetent = (
        <Icon
          name="info"
          title={errorMessage}
          style={{ color: 'red', cursor: 'help' }}
        />
      );
    } else if (isReconstructed) {
      toggleVisibilityConetent = (
        <button onClick={evt => this.onToggleVisibility(uid)}>
          <Icon name={visible ? 'eye' : 'eye-closed'} />
        </button>
      );
    }

    return (
      <tr>
        <td className="centered-cell">{roiNumberContent}</td>
        <td className="left-aligned-cell">{name}</td>
        <td>{toggleVisibilityConetent}</td>
      </tr>
    );
  }
}
