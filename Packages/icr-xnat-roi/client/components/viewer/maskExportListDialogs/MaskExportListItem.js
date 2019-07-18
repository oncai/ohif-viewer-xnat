import React from "react";
import { cornerstoneTools } from "meteor/ohif:cornerstone";

const brushModule = cornerstoneTools.store.modules.brush;

export default class MaskExportListItem extends React.Component {
  constructor(props = {}) {
    super(props);

    this._colormap = cornerstone.colors.getColormap(
      brushModule.state.colorMapId
    );

    this._getColor = this._getColor.bind(this);
  }

  /**
   * _getColor - Returns a CSS formatted color for the given segIndex.
   *
   * @param  {number} segIndex The segment index.
   * @returns {string}
   */
  _getColor(segIndex) {
    const colorArray = this._colormap.getColor(segIndex);

    return `rgba(
      ${colorArray[[0]]}, ${colorArray[[1]]}, ${colorArray[[2]]}, 1.0
    )`;
  }

  render() {
    const { segIndex, metadata } = this.props;

    const SegmentedPropertyTypeCodeSequence =
      metadata.SegmentedPropertyTypeCodeSequence;

    let type = SegmentedPropertyTypeCodeSequence.CodeMeaning;

    if (
      SegmentedPropertyTypeCodeSequence.SegmentedPropertyTypeModifierCodeSequence
    ) {
      const modifier =
        SegmentedPropertyTypeCodeSequence
          .SegmentedPropertyTypeModifierCodeSequence.CodeMeaning;

      type += ` (${modifier})`;
    }

    return (
      <tr>
        <td className="left-aligned-cell">
          <i
            className="fa fa-square"
            style={{ color: this._getColor(segIndex) }}
          />
          {metadata.SegmentLabel}
        </td>
        <td>{metadata.SegmentedPropertyCategoryCodeSequence.CodeMeaning}</td>
        <td>{type}</td>
      </tr>
    );
  }
}
