import React from 'react';
import SegmentationMenuListItem from './SegmentationMenuListItem.js';
import { newSegment } from './utils/segmentationMetadataIO';

import '../XNATSegmentationPanel.styl';
import { Icon } from '@ohif/ui';

/**
 * @class SegmentationMenuListBody - Renders a list of SegmentationMenuListItems,
 * displaying the metadata of segments.
 */
export default class SegmentationMenuListBody extends React.Component {
  constructor(props = {}) {
    super(props);
  }

  render() {
    const {
      segments,
      activeSegmentIndex,
      onSegmentChange,
      onEditClick,
      onDeleteClick,
      labelmap3D,
      onNewSegment,
    } = this.props;

    return (
      <React.Fragment>
        {segments.map(segment => (
          <SegmentationMenuListItem
            key={`${segment.metadata.SegmentLabel}_${segment.index}`}
            segmentIndex={segment.index}
            metadata={segment.metadata}
            onSegmentChange={onSegmentChange}
            onEditClick={onEditClick}
            onDeleteClick={onDeleteClick}
            checked={segment.index === activeSegmentIndex}
            labelmap3D={labelmap3D}
          />
        ))}
        <tr>
          <th />
          <th>
            <a
              className="segmentation-menu-new-button btn btn-sm btn-primary"
              onClick={onNewSegment}
            >
              <Icon name="xnat-tree-plus" /> New Mask
            </a>
          </th>
        </tr>
      </React.Fragment>
    );
  }
}
