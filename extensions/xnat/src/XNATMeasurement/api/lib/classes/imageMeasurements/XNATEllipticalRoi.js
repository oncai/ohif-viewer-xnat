import React from 'react';
import ImageMeasurement from './ImageMeasurement';
import { XNATToolTypes } from '../../../../measurement-tools';
import FormattedValue from "./utils/FormattedValue";

export default class XNATEllipticalRoi extends ImageMeasurement {
  static get genericToolType() {
    return 'EllipticalRoi';
  }

  static get toolType() {
    return XNATToolTypes.ELLIPTICAL_ROI;
  }

  static get icon() {
    return 'xnat-measure-circle';
  }

  constructor(isImported, props) {
    super(isImported, props);
  }

  get displayText() {
    const csData = this.csData;
    const spatialUnit = this.metadata.unit;
    let displayText = null;
    if (csData && csData.cachedStats) {
      // area, count, mean, variance, stdDev, min, max, meanStdDevSUV
      const { area, mean, stdDev } = csData.cachedStats;
      const pixelUnit = csData.unit;
      displayText = (
        <>
          <FormattedValue
            prefix={'Area'}
            value={area.toFixed(0)}
            suffix={spatialUnit + String.fromCharCode(178)}
          />
          <FormattedValue
            prefix={'Mean'}
            value={mean.toFixed(0)}
            suffix={pixelUnit}
          />
        </>
      );
    }
    return displayText;
  }

  generateDataObject() {
    // Unit in csData stores the pixel value unit (i.e. HU)
    const { cachedStats: stats, unit, handles } = this.csData;
    this._xnat.data = {
      stats,
      unit,
      handles: { ...handles },
    };
    return super.generateDataObject();
  }
}
