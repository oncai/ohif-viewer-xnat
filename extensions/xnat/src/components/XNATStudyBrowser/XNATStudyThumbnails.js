import React from 'react';
import { XNATThumbnail } from './XNATThumbnail';

import './XNATStudyBrowser.styl';

const XNATStudyThumbnails = props => {
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
        active,
        altImageText,
        displaySetInstanceUID,
        imageId,
        InstanceNumber,
        numImageFrames,
        SeriesDescription,
        SeriesNumber,
        stackPercentComplete,
        hasWarnings,
      } = thumb;

      return (
        <div
          key={thumb.displaySetInstanceUID}
          className="thumbnail-container"
          data-cy="thumbnail-list"
        >
          <XNATThumbnail
            active={active}
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
            hasWarnings={hasWarnings}
            stackPercentComplete={stackPercentComplete}
            // Events
            onClick={onThumbnailClick.bind(undefined, displaySetInstanceUID)}
            onDoubleClick={onThumbnailDoubleClick}
          />
        </div>
      );
    });
};

export default XNATStudyThumbnails;
