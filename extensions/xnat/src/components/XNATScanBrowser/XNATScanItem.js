import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';
import { XNATThumbnail } from './XNATThumbnail';
import './XNATScanBrowser.styl';

function XNATScanItem(props) {
  const {
    study,
    studyIndex,
    onThumbnailClick,
    onThumbnailDoubleClick,
    supportsDrag,
  } = props;

  const [expanded, setExpanded] = useState(true);

  const getExpandIcon = () => {
    if (expanded) {
      return <Icon name="xnat-tree-minus" />;
    }
    return <Icon name="xnat-tree-plus" />;
  };

  return (
    <React.Fragment key={studyIndex}>
      <div className="studyDescription">
        <a
          className="btn btn-sm btn-secondary"
          onClick={() => setExpanded(!expanded)}
        >
          {getExpandIcon()}
        </a>
        {study.StudyDescription}
      </div>
      {expanded ? (
        <StudyThumbnails
          study={study}
          supportsDrag={supportsDrag}
          studyIndex={studyIndex}
          onThumbnailClick={onThumbnailClick}
          onThumbnailDoubleClick={onThumbnailDoubleClick}
        />
      ) : null}
    </React.Fragment>
  );
}

const noop = () => {};

XNATScanItem.propTypes = {
  study: PropTypes.any,
  studyIndex: PropTypes.any,
  supportsDrag: PropTypes.bool,
  onThumbnailClick: PropTypes.func,
  onThumbnailDoubleClick: PropTypes.func,
};

XNATScanItem.defaultProps = {
  study: undefined,
  studyIndex: undefined,
  supportsDrag: true,
  onThumbnailClick: noop,
  onThumbnailDoubleClick: noop,
};

const StudyThumbnails = props => {
  const {
    study,
    supportsDrag,
    studyIndex,
    onThumbnailClick,
    onThumbnailDoubleClick,
  } = props;
  const { StudyInstanceUID } = study;
  return study.thumbnails
    .filter(thumb => {
      return thumb.imageId !== undefined;
    })
    .map((thumb, thumbIndex) => {
      // TODO: Thumb has more props than we care about?
      const {
        altImageText,
        displaySetInstanceUID,
        imageId,
        InstanceNumber,
        numImageFrames,
        SeriesDescription,
        SeriesNumber,
        stackPercentComplete,
      } = thumb;

      return (
        <div
          key={thumb.displaySetInstanceUID}
          className="thumbnail-container"
          data-cy="thumbnail-list"
        >
          <XNATThumbnail
            supportsDrag={supportsDrag}
            key={`${studyIndex}_${thumbIndex}`}
            id={`${studyIndex}_${thumbIndex}`} // Unused?
            // Study
            StudyInstanceUID={StudyInstanceUID} // used by drop
            // Thumb
            altImageText={altImageText}
            imageId={imageId}
            InstanceNumber={InstanceNumber}
            displaySetInstanceUID={displaySetInstanceUID} // used by drop
            numImageFrames={numImageFrames}
            SeriesDescription={SeriesDescription}
            SeriesNumber={SeriesNumber}
            stackPercentComplete={stackPercentComplete}
            // Events
            onClick={onThumbnailClick.bind(undefined, displaySetInstanceUID)}
            onDoubleClick={onThumbnailDoubleClick}
          />
        </div>
      );
    });
};

export { XNATScanItem };
