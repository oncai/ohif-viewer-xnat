import React from 'react';
import cornerstoneTools from 'cornerstone-tools';
import { Icon } from '@ohif/ui';
import '../XNATSegmentationPanel.styl';

const segmentationModule = cornerstoneTools.getModule('segmentation');

/**
 * @class SegmentationMenuListItem - Renders metadata for a single segment.
 */
export default class SegmentationMenuListItem extends React.Component {
  constructor(props = {}) {
    super(props);

    this.onTextInputChange = this.onTextInputChange.bind(this);
    this._getTypeWithModifier = this._getTypeWithModifier.bind(this);
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

  onTextInputChange(evt) {
    const SegmentLabel = evt.target.value;
    const { labelmap3D, segmentIndex } = this.props;

    if (SegmentLabel.replace(' ', '').length > 0) {
      labelmap3D.metadata[segmentIndex].SegmentLabel = SegmentLabel;
    }
  }

  render() {
    const {
      metadata,
      segmentIndex,
      onSegmentChange,
      onEditClick,
      checked,
    } = this.props;

    const segmentLabel = metadata.SegmentLabel;
    const colorLUT = segmentationModule.getters.colorLUT(0);
    const color = colorLUT[segmentIndex];
    const segmentColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 1.0 )`;

    const segmentCategory =
      metadata.SegmentedPropertyCategoryCodeSequence.CodeMeaning;
    const typeWithModifier = this._getTypeWithModifier();

    const visible = true;
    const showHideIcon = visible ? (
      <Icon name="eye" />
    ) : (
      <Icon name="eye-closed" />
    );

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
          <input
            name="segLabel"
            className="roiEdit"
            onChange={this.onTextInputChange}
            type="text"
            autoComplete="off"
            defaultValue={segmentLabel}
            placeholder="Enter ROI Name..."
            tabIndex="1"
          />
        </td>
        <td>
          <a
            style={{ cursor: 'pointer', color: 'white' }}
            onClick={() => {
              onEditClick(segmentIndex, metadata);
            }}
          >
            {typeWithModifier}
            {' - '}
            {segmentCategory}
          </a>
        </td>
        <td className="centered-cell">
          <button className="small"
                  // onClick={this.onShowHideClick}
          >
            {showHideIcon}
          </button>
        </td>
      </tr>
    );
  }
}
