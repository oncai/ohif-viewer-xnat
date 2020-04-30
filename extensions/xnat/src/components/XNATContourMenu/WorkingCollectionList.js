import React from 'react';
import WorkingCollectionListItem from './WorkingCollectionListItem.js';
import { Icon } from '@ohif/ui';

import '../XNATContourPanel.styl';

/**
 * @class WorkingRoiCollectionList - Renders a list of
 * WorkingCollectionListItem, displaying metadata of the working ROIContour
 * Collection.
 */
export default class WorkingRoiCollectionList extends React.Component {
  constructor(props = {}) {
    super(props);
  }

  render() {
    const {
      workingCollection,
      activeROIContourIndex,
      onRoiChange,
      onNewRoiButtonClick,
      seriesInstanceUid,
    } = this.props;

    return (
      <React.Fragment>
        <tr className="roi-list-header">
          <th />
          <th colSpan="4"> New Contour Collection</th>
        </tr>

        <tr>
          <th>Draw</th>
          <th>Name</th>
          <th className="centered-cell">Contours</th>
        </tr>

        {workingCollection.map(roiContour => (
          <WorkingCollectionListItem
            key={roiContour.metadata.uid}
            roiContourIndex={roiContour.index}
            metadata={roiContour.metadata}
            activeROIContourIndex={activeROIContourIndex}
            onRoiChange={onRoiChange}
            seriesInstanceUid={seriesInstanceUid}
          />
        ))}

        <tr>
          <th />
          <th>
            <a
              className="roi-contour-menu-new-button btn btn-primary"
              onClick={onNewRoiButtonClick}
            >
              <Icon name="xnat-tree-plus" /> Add Contour
            </a>
          </th>
        </tr>
      </React.Fragment>
    );
  }
}
