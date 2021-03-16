import React from 'react';
import PropTypes from 'prop-types';
import cornerstoneTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';
import { Icon } from '@ohif/ui';
import ColoredCircle from '../common/ColoredCircle';

import '../XNATRoiPanel.styl';
import WorkingCollectionListItem from './WorkingCollectionListItem';

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
    onClick: PropTypes.func,
  };

  static defaultProps = {
    collection: undefined,
    onUnlockClick: undefined,
    SeriesInstanceUID: undefined,
    onClick: undefined,
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
    const { collection, onUnlockClick, onClick } = this.props;
    const { expanded, visible } = this.state;

    const metadata = collection.metadata;
    const ROIContourArray = collection.ROIContourArray;

    return (
      <div className="collectionSection">
        <div className="header">
          <h5>{metadata.name}</h5>
          <div className="icons">
            <Icon
              name="lock"
              className="icon"
              width="20px"
              height="20px"
              onClick={() => {
                onUnlockClick(metadata.uid);
              }}
            />
            <Icon
              name={visible ? "eye" : "eye-closed"}
              className="icon"
              width="20px"
              height="20px"
              onClick={this.onShowHideClick}
            />
            <Icon
              name={`angle-double-${expanded ? 'down' : 'up'}`}
              className="icon"
              width="20px"
              height="20px"
              onClick={() => {
                this.setState({ expanded: !expanded });
              }}
            />
          </div>
        </div>

        {expanded &&
        <div>
          <table className="collectionTable">
            <thead>
              <tr>
                <th width="5%" className="centered-cell">
                  #
                </th>
                <th width="85%" className="left-aligned-cell">
                  ROI Name
                </th>
                <th width="10%" className="centered-cell">
                  N
                </th>
              </tr>
            </thead>
            <tbody>
            {ROIContourArray.map(roiContour => (
              <tr key={roiContour.metadata.uid}>
                <td className="centered-cell">
                  <ColoredCircle color={roiContour.metadata.color} />
                </td>
                <td className="left-aligned-cell">
                  {roiContour.metadata.name}
                </td>
                <td className="centered-cell">
                  <a
                    style={{ cursor: 'pointer', color: 'white' }}
                    onClick={() => roiContour.metadata.polygonCount ? onClick(roiContour.metadata.uid) : null}
                  >
                    {roiContour.metadata.polygonCount}
                  </a>
                </td>
              </tr>
            ))}
             </tbody>
          </table>
        </div>
        }
      </div>
    );
  }
}
