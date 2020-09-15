import React from 'react';
import PropTypes from 'prop-types';
import LockedCollectionsListItem from './LockedCollectionsListItem.js';

import '../XNATRoiPanel.styl';

/**
 * @class LockedCollectionsList - Renders a list of LockedCollectionsListItems,
 * displaying metadata of locked ROIContour Collections.
 */
export default class LockedCollectionsList extends React.Component {
  static propTypes = {
    lockedCollections: PropTypes.any,
    onUnlockClick: PropTypes.any,
    SeriesInstanceUID: PropTypes.any,
  };

  static defaultProps = {
    lockedCollections: undefined,
    onUnlockClick: undefined,
    SeriesInstanceUID: undefined,
  };

  constructor(props = {}) {
    super(props);
  }

  render() {
    const { lockedCollections, onUnlockClick, SeriesInstanceUID } = this.props;

    return (
      <React.Fragment>
        {lockedCollections.map(collection => (
          <LockedCollectionsListItem
            key={collection.metadata.uid}
            collection={collection}
            onUnlockClick={onUnlockClick}
            SeriesInstanceUID={SeriesInstanceUID}
          />
        ))}
      </React.Fragment>
    );
  }
}
