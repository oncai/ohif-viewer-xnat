import React from 'react';
import PropTypes from 'prop-types';
import WorkingCollectionListItem from './WorkingCollectionListItem.js';
import { Icon } from '@ohif/ui';

import '../XNATRoiPanel.styl';

/**
 * @class WorkingRoiCollectionList - Renders a list of
 * WorkingCollectionListItem, displaying metadata of the working ROIContour
 * Collection.
 */
export default class WorkingRoiCollectionList extends React.Component {
  static propTypes = {
    workingCollection: PropTypes.any,
    activeROIContourIndex: PropTypes.any,
    onRoiChange: PropTypes.any,
    SeriesInstanceUID: PropTypes.any,
    onContourClick: PropTypes.func,
  };

  static defaultProps = {
    workingCollection: undefined,
    activeROIContourIndex: undefined,
    onRoiChange: undefined,
    SeriesInstanceUID: undefined,
    onClick: undefined,
  };

  constructor(props = {}) {
    super(props);
  }

  render() {
    const {
      workingCollection,
      activeROIContourIndex,
      onRoiChange,
      SeriesInstanceUID,
      onContourClick,
    } = this.props;

    return (
      <React.Fragment>
        {workingCollection.map(roiContour => (
          <WorkingCollectionListItem
            key={roiContour.metadata.uid}
            roiContourIndex={roiContour.index}
            metadata={roiContour.metadata}
            activeROIContourIndex={activeROIContourIndex}
            onRoiChange={onRoiChange}
            SeriesInstanceUID={SeriesInstanceUID}
            onClick={onContourClick}
          />
        ))}
      </React.Fragment>
    );
  }
}
