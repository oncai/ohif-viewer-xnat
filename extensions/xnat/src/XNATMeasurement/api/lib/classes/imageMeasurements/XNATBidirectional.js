import React from 'react';
import ImageMeasurement from './ImageMeasurement';
import { XNATToolTypes } from '../../../../measurement-tools';
import { FormattedValue } from '../../../../../elements';

export default class XNATBidirectional extends ImageMeasurement {
  static get genericToolType() {
    return 'Bidirectional';
  }

  static get toolType() {
    return XNATToolTypes.BIDIRECTIONAL;
  }

  static get icon() {
    return 'xnat-measure-bidirectional';
  }

  constructor(isImported, props) {
    super(isImported, props);
  }

  get displayText() {
    const csData = this.csData;
    const { spatialUnit } = this.measurementUnits;
    let displayText = null;
    if (csData && csData.longestDiameter && csData.shortestDiameter) {
      displayText = (
        <>
          <FormattedValue
            prefix={'L'}
            value={csData.longestDiameter}
            suffix={spatialUnit}
          />
          <FormattedValue
            prefix={'W'}
            value={csData.shortestDiameter}
            suffix={spatialUnit}
          />
        </>
      );
    }
    return displayText;
  }

  generateDataObject() {
    const dataObject = super.generateDataObject();

    const { shortestDiameter, longestDiameter, handles } = this.csData;
    dataObject.data = {
      shortestDiameter,
      longestDiameter,
      handles: { ...handles },
    };

    const values = dataObject.measurements;
    const { spatialUnit } = this.measurementUnits;
    values.push({
      name: 'shortestDiameter',
      value: parseFloat(shortestDiameter),
      unit: spatialUnit,
    });
    values.push({
      name: 'longestDiameter',
      value: parseFloat(longestDiameter),
      unit: spatialUnit,
    });

    return dataObject;
  }
}
