import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';
import { contourRenderingApi } from '../../utils/contourRois';
import ContourRoiItem from './ContourRoiItem';

/**
 * @class ContourRoiCollection - Renders metadata for an individual MPR-based
 * ROIContour Collection.
 */
export default class ContourRoiCollection extends React.Component {
  static propTypes = {
    collectionUid: PropTypes.string.isRequired,
  };

  static defaultProps = {};

  constructor(props = {}) {
    super(props);

    this._collection = contourRenderingApi.getCollection(props.collectionUid);

    this.state = {
      expanded: false,
    };

    this.onToggleExpandClick = this.onToggleExpandClick.bind(this);
  }

  onToggleExpandClick() {
    const { expanded } = this.state;

    this.setState({ expanded: !expanded });
  }

  render() {
    const { expanded } = this.state;
    const { name, isLocked, meshProps } = this._collection;

    const collectionName = isLocked ? name : 'In-Progress Collection';

    const expandStyle = expanded ? {} : { transform: 'rotate(90deg)' };

    return (
      <div className="collectionSection">
        <div className={`collectionHeader${expanded ? ' expanded' : ''}`}>
          <h5>{collectionName}</h5>
          <div className="icons">
            <Icon
              name={`angle-double-${expanded ? 'down' : 'up'}`}
              className="icon"
              style={expandStyle}
              width="20px"
              height="20px"
              onClick={this.onToggleExpandClick}
            />
          </div>
        </div>

        {expanded && (
          <>
            <table className="collectionTable">
              <thead>
                <tr>
                  <th width="5%" className="centered-cell">
                    #
                  </th>
                  <th width="85%" className="left-aligned-cell">
                    ROI Name
                  </th>
                  <th width="10%" className="centered-cell" />
                </tr>
              </thead>
              <tbody>
                {meshProps.validRois.map(roi => (
                  <ContourRoiItem key={roi.uid} roiUid={roi.uid} />
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    );
  }
}
