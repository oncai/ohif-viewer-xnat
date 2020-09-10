//ToDo: move to XNAT extension
import React from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';

import * as helpers from './helpers';
import XNATSmooth from './XNATSmooth';
import XNATSync from './XNATSync';

class XNATViewportOverlay extends React.PureComponent {
  static propTypes = {
    scale: PropTypes.number.isRequired,
    windowWidth: PropTypes.number.isRequired,
    windowCenter: PropTypes.number.isRequired,
    imageId: PropTypes.string.isRequired,
    imageIndex: PropTypes.number.isRequired,
    stackSize: PropTypes.number.isRequired,
  };

  render() {
    const { imageId, scale, windowWidth, windowCenter } = this.props;

    if (!imageId) {
      return null;
    }

    const zoomPercentage = helpers.formatNumberPrecision(scale * 100, 0);
    const seriesMetadata =
      cornerstone.metaData.get('generalSeriesModule', imageId) || {};
    const imagePlaneModule =
      cornerstone.metaData.get('imagePlaneModule', imageId) || {};
    const { rows, columns, sliceThickness, sliceLocation } = imagePlaneModule;
    const { seriesNumber, seriesDescription } = seriesMetadata;

    const generalStudyModule =
      cornerstone.metaData.get('generalStudyModule', imageId) || {};
    const { studyDate, studyTime, studyDescription } = generalStudyModule;

    const patientModule =
      cornerstone.metaData.get('patientModule', imageId) || {};
    const { patientId, patientName } = patientModule;

    const generalImageModule =
      cornerstone.metaData.get('generalImageModule', imageId) || {};
    const { instanceNumber } = generalImageModule;

    const cineModule = cornerstone.metaData.get('cineModule', imageId) || {};
    const { frameTime } = cineModule;

    const frameRate = helpers.formatNumberPrecision(1000 / frameTime, 1);
    const compression = helpers.getCompression(imageId);
    const wwwc = `W: ${windowWidth.toFixed(0)} L: ${windowCenter.toFixed(0)}`;
    const imageDimensions = `${columns} x ${rows}`;

    const { imageIndex, stackSize } = this.props;

    const normal = (
      <React.Fragment>
        <div className="top-left overlay-element">
          <div>{helpers.formatPN(patientName)}</div>
          <div>{patientId}</div>
        </div>
        <div className="top-right overlay-element">
          <div>{studyDescription}</div>
          <div>
            {helpers.formatDA(studyDate)} {helpers.formatTM(studyTime)}
          </div>
          <XNATSync />
          <XNATSmooth />
        </div>
        <div className="bottom-right overlay-element">
          <div>Zoom: {zoomPercentage}%</div>
          <div>{wwwc}</div>
          <div className="compressionIndicator">{compression}</div>
        </div>
        <div className="bottom-left overlay-element">
          <div>{seriesNumber >= 0 ? `Ser: ${seriesNumber}` : ''}</div>
          <div>
            {stackSize > 1
              ? `Img: ${instanceNumber} ${imageIndex}/${stackSize}`
              : ''}
          </div>
          <div>
            {frameRate >= 0 ? `${helpers.formatNumberPrecision(frameRate, 2)} FPS` : ''}
            <div>{imageDimensions}</div>
            <div>
              {helpers.isValidNumber(sliceLocation)
                ? `Loc: ${helpers.formatNumberPrecision(sliceLocation, 2)} mm `
                : ''}
              {sliceThickness
                ? `Thick: ${helpers.formatNumberPrecision(sliceThickness, 2)} mm`
                : ''}
            </div>
            <div>{seriesDescription}</div>
          </div>
        </div>
      </React.Fragment>
    );

    return <div className="ViewportOverlay">{normal}</div>;
  }
}

export { XNATViewportOverlay };
