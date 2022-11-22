import React from 'react';
import ImageMeasurement from './ImageMeasurement';
import { XNATToolTypes } from '../../../../measurement-tools';
import FormattedValue from './utils/FormattedValue';

export default class XNATRectangleRoi extends ImageMeasurement {
  static get genericToolType() {
    return 'RectangleRoi';
  }

  static get toolType() {
    return XNATToolTypes.RECTANGLE_ROI;
  }

  static get icon() {
    return 'xnat-measure-rectangle';
  }

  constructor(isImported, props) {
    super(isImported, props);
  }

  get displayText() {
    const csData = this.csData;
    const { areaUnit } = this.measurementUnits;
    let displayText = null;
    if (csData && csData.cachedStats) {
      // area, count, mean, variance, stdDev, min, max, meanStdDevSUV
      const { area } = csData.cachedStats;
      displayText = (
        <>
          <FormattedValue
            prefix={'Area'}
            value={area.toFixed(0)}
            suffix={areaUnit}
          />
        </>
      );
    }
    return displayText;
  }

  generateDataObject() {
    const dataObject = super.generateDataObject();

    const { cachedStats, handles } = this.csData;
    dataObject.data = {
      cachedStats,
      handles: { ...handles },
    };

    const values = dataObject.measurements;
    const { areaUnit, pixelUnit } = this.measurementUnits;

    if (cachedStats) {
      const {
        area,
        count,
        mean,
        variance,
        stdDev,
        min,
        max,
        meanStdDevSUV,
      } = cachedStats;
      if (area !== undefined)
        values.push({ name: 'area', value: area, unit: areaUnit });
      if (count !== undefined) values.push({ name: 'count', value: count });
      values.push({ name: 'mean', value: mean, unit: pixelUnit });
      if (variance !== undefined)
        values.push({ name: 'variance', value: variance });
      if (stdDev !== undefined)
        values.push({ name: 'stdDev', value: stdDev, unit: pixelUnit });
      if (min !== undefined)
        values.push({ name: 'min', value: min, unit: pixelUnit });
      if (max !== undefined)
        values.push({ name: 'max', value: max, unit: pixelUnit });
      if (meanStdDevSUV !== undefined)
        values.push({ name: 'meanStdDevSUV', value: meanStdDevSUV });
    }

    return dataObject;
  }
}
