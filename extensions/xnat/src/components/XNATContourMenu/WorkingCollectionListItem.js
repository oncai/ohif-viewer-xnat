import React from 'react';
import PropTypes from 'prop-types';
import { store } from 'cornerstone-tools';

import '../XNATRoiPanel.styl';
import cornerstone from 'cornerstone-core';
import { Icon } from '@ohif/ui';

const modules = store.modules;

/**
 * @class WorkingCollectionListItem - Renders metadata for the working
 * ROIContour Collection.
 */
export default class WorkingCollectionListItem extends React.Component {
  static propTypes = {
    roiContourIndex: PropTypes.any,
    metadata: PropTypes.any,
    activeROIContourIndex: PropTypes.any,
    onRoiChange: PropTypes.any,
    SeriesInstanceUID: PropTypes.any,
    onClick: PropTypes.func,
  };

  static defaultProps = {
    roiContourIndex: undefined,
    metadata: undefined,
    activeROIContourIndex: undefined,
    onRoiChange: undefined,
    SeriesInstanceUID: undefined,
    onClick: undefined,
  };

  constructor(props = {}) {
    super(props);

    this.onTextInputChange = this.onTextInputChange.bind(this);
    this.onShowHideClick = this.onShowHideClick.bind(this);

    const visible = this.props.metadata.visible;

    this.state = {
      visible,
    };
  }

  onTextInputChange(evt) {
    const name = evt.target.value;
    const { SeriesInstanceUID } = this.props;

    if (name.replace(' ', '').length > 0) {
      const metadata = this.props.metadata;
      const freehand3DModule = modules.freehand3D;

      freehand3DModule.setters.ROIContourName(
        name,
        SeriesInstanceUID,
        'DEFAULT',
        metadata.uid
      );
    }
  }

  /**
   * onShowHideClick - Toggles the visibility of the collections ROI Contours.
   *
   * @returns {null}
   */
  onShowHideClick() {
    const { metadata } = this.props;
    const { visible } = this.state;

    metadata.visible = !visible;
    this.setState({ visible: !visible });

    cornerstone.getEnabledElements().forEach(enabledElement => {
      cornerstone.updateImage(enabledElement.element);
    });
  }

  render() {
    const {
      roiContourIndex,
      metadata,
      onRoiChange,
      activeROIContourIndex,
    } = this.props;

    const checked = activeROIContourIndex === roiContourIndex;
    const name = metadata.name;
    const polygonCount = metadata.polygonCount;
    const roiContourColor = metadata.color;

    const { visible } = this.state;
    const showHideIcon = visible ? (
      <Icon name="eye" />
    ) : (
      <Icon name="eye-closed" />
    );

    return (
      <tr>
        <td style={{ backgroundColor: roiContourColor }}>
          <input
            type="radio"
            checked={checked}
            onChange={() => onRoiChange(roiContourIndex)}
            style={{ backgroundColor: roiContourColor }}
          />
        </td>
        <td className="left-aligned-cell">
          <input
            name="roiContourName"
            className="roiEdit"
            onChange={this.onTextInputChange}
            type="text"
            autoComplete="off"
            defaultValue={name}
            placeholder="Enter ROI Name..."
            tabIndex="1"
          />
        </td>
        <td className="centered-cell">
          <a
            style={{ cursor: 'pointer', color: 'white' }}
            onClick={this.props.onClick}
          >
            {polygonCount}
          </a>
        </td>
        <td className="centered-cell">
          <button className="small" onClick={this.onShowHideClick}>
            {showHideIcon}
          </button>
        </td>
      </tr>
    );
  }
}
