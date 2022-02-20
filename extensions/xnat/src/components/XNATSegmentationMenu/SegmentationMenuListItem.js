import React from 'react';
import cornerstoneTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';
import { Icon } from '@ohif/ui';
import '../XNATRoiPanel.styl';

const segmentationModule = cornerstoneTools.getModule('segmentation');

/**
 * @class SegmentationMenuListItem - Renders metadata for a single segment.
 */
export default class SegmentationMenuListItem extends React.Component {
  constructor(props = {}) {
    super(props);

    this._getTypeWithModifier = this._getTypeWithModifier.bind(this);
    this.onShowHideClick = this.onShowHideClick.bind(this);
    this.onColorChangeCallback = this.onColorChangeCallback.bind(this);

    const { segmentIndex, labelmap3D, metadata } = props;

    const colorLUT = segmentationModule.getters.colorLUT(
      labelmap3D.colorLUTIndex
    );
    const color = colorLUT[segmentIndex];
    const segmentColor = _colorArrayToRGBColor(color);

    this.state = {
      visible: !labelmap3D.segmentsHidden[segmentIndex],
      segmentLabel: metadata.SegmentLabel,
      segmentColor,
    };
  }

  onColorChangeCallback(colorArray) {
    const segmentColor = _colorArrayToRGBColor(colorArray);

    this.setState({ segmentColor });
  }

  /**
   * _getTypeWithModifier - Returns the segment type with its modifier as a string.
   *
   * @returns {string}
   */
  _getTypeWithModifier() {
    const { metadata } = this.props;

    let typeWithModifier =
      metadata.SegmentedPropertyTypeCodeSequence.CodeMeaning;

    const modifier =
      metadata.SegmentedPropertyTypeCodeSequence
        .SegmentedPropertyTypeModifierCodeSequence;

    if (modifier) {
      typeWithModifier += ` (${modifier.CodeMeaning})`;
    }

    return typeWithModifier;
  }

  onShowHideClick() {
    let { visible } = this.state;
    const { segmentIndex, labelmap3D } = this.props;

    visible = !visible;
    labelmap3D.segmentsHidden[segmentIndex] = !visible;

    cornerstoneTools.store.state.enabledElements.forEach(element => {
      cornerstone.updateImage(element);
    });

    this.setState({ visible });
  }

  render() {
    const {
      metadata,
      segmentIndex,
      onSegmentChange,
      onEditClick,
      checked,
      labelmap3D,
      showColorSelectModal,
      onDeleteClick,
      onClick,
    } = this.props;

    const { visible, segmentLabel, segmentColor } = this.state;

    const segmentCategory =
      metadata.SegmentedPropertyCategoryCodeSequence.CodeMeaning;
    const typeWithModifier = this._getTypeWithModifier();

    const showHideIcon = visible ? (
      <Icon name="eye" />
    ) : (
      <Icon name="eye-closed" />
    );

    let slices = [];
    for (const [key, value] of Object.entries(labelmap3D.labelmaps2D)) {
      if (value.segmentsOnLabelmap.includes(segmentIndex)) {
        slices.push(key);
      }
    }
    const midSlice = slices.length
      ? slices[Math.floor(slices.length / 2)]
      : undefined;

    return (
      <tr>
        <td className="centered-cell" style={{ backgroundColor: segmentColor }}>
          <input
            type="radio"
            checked={checked}
            onChange={() => {
              onSegmentChange(segmentIndex);
            }}
          />
        </td>
        <td className="left-aligned-cell">
          <a
            style={{ cursor: 'pointer'}}
            onClick={() => {
              onEditClick(segmentIndex, metadata);
            }}
          >
            <span style={{ color: 'var(--text-primary-color)' }}>
              {segmentLabel}
            </span>
            <span
              style={{ color: 'var(--text-secondary-color)', display: 'block' }}
            >
              {typeWithModifier}
              {' - '}
              {segmentCategory}
            </span>
          </a>
        </td>
        <td className="centered-cell">
          <a
            style={{ cursor: 'pointer', color: 'white' }}
            onClick={() =>
              midSlice !== undefined ? onClick(segmentIndex, midSlice) : null
            }
          >
            {slices.length ? `${slices.length}` : '0'}
          </a>
        </td>
        <td className="centered-cell">
          <button className="small" onClick={() => onDeleteClick(segmentIndex)}>
            <Icon name="trash" style={{ width: 13 }} />
          </button>
        </td>
        <td className="centered-cell">
          <button className="small" onClick={this.onShowHideClick}>
            {showHideIcon}
          </button>
        </td>
        <td className="centered-cell">
          <button
            className="small"
            onClick={() =>
              showColorSelectModal(
                labelmap3D,
                segmentIndex,
                segmentLabel,
                this.onColorChangeCallback
              )
            }
          >
            <Icon name="palette" />
          </button>
        </td>
      </tr>
    );
  }
}

function _colorArrayToRGBColor(colorArray) {
  return `rgba(${colorArray[0]}, ${colorArray[1]}, ${colorArray[2]}, 1.0 )`;
}
