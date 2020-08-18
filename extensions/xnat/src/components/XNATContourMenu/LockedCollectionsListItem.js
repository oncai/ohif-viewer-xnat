import React from 'react';
import PropTypes from 'prop-types';
import cornerstoneTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';
import { Icon } from '@ohif/ui';
import ColoredCircle from '../common/ColoredCircle';

import '../XNATRoiPanel.styl';

const modules = cornerstoneTools.store.modules;

/**
 * @class LockedCollectionsListItem - Renders metadata for an individual locked
 * ROIContour Collection.
 */
export default class LockedCollectionsListItem extends React.Component {
  static propTypes = {
    collection: PropTypes.any,
    onUnlockClick: PropTypes.any,
    SeriesInstanceUID: PropTypes.any,
  };

  static defaultProps = {
    collection: undefined,
    onUnlockClick: undefined,
    SeriesInstanceUID: undefined,
  };

  constructor(props = {}) {
    super(props);

    const visible = this.props.collection.metadata.visible;

    this.state = {
      expanded: false,
      visible,
    };

    this.onToggleVisibilityClick = this.onToggleVisibilityClick.bind(this);
    this.onShowHideClick = this.onShowHideClick.bind(this);
  }

  /**
   * onToggleVisibilityClick - Callback that toggles the expands/collapses the
   * list of collection metadata.
   *
   * @returns {null}
   */
  onToggleVisibilityClick() {
    const { expanded } = this.state;

    this.setState({ expanded: !expanded });
  }

  /**
   * onShowHideClick - Toggles the visibility of the collections ROI Contours.
   *
   * @returns {null}
   */
  onShowHideClick() {
    const { collection, SeriesInstanceUID } = this.props;
    const { visible } = this.state;
    const structureSet = modules.freehand3D.getters.structureSet(
      SeriesInstanceUID,
      collection.metadata.uid
    );

    structureSet.visible = !visible;
    this.setState({ visible: !visible });

    cornerstone.getEnabledElements().forEach(enabledElement => {
      cornerstone.updateImage(enabledElement.element);
    });
  }

  render() {
    const { collection, onUnlockClick } = this.props;
    const { expanded, visible } = this.state;

    const metadata = collection.metadata;
    const ROIContourArray = collection.ROIContourArray;

    const showHideIcon = visible ? (
      <Icon name="eye" />
    ) : (
      <Icon name="eye-closed" />
    );

    const visibleButton = expanded ? (
      <Icon name="chevron-down" />
    ) : (
      <Icon name="plus" />
    );

    return (
      <React.Fragment>
        <tr>
          <td width="10%" className="centered-cell">
            <button className="small" onClick={this.onToggleVisibilityClick}>
              {visibleButton}
            </button>
          </td>
          <td width="70%">{metadata.name}</td>
          <td width="10%" className="centered-cell">
            <button className="small" onClick={this.onShowHideClick}>
              {showHideIcon}
            </button>
          </td>
          <td width="10%" className="centered-cell">
            <button
              className="small"
              onClick={() => {
                onUnlockClick(metadata.uid);
              }}
            >
              <Icon name="lock" />
            </button>
          </td>
        </tr>

        {expanded && (
          <React.Fragment>
            {ROIContourArray.map(roiContour => (
              <tr key={roiContour.metadata.uid} className="subRow">
                <td className="centered-cell">
                  <ColoredCircle color={roiContour.metadata.color} />
                </td>
                <td className="left-aligned-cell">
                  {roiContour.metadata.name}
                </td>
                <td className="centered-cell">
                  {roiContour.metadata.polygonCount}
                </td>
              </tr>
            ))}
          </React.Fragment>
        )}
      </React.Fragment>
    );
  }
}
