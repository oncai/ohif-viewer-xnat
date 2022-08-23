import React from 'react';
import ImageMeasurement from './ImageMeasurement';
import { XNATToolTypes } from '../../../../measurement-tools';
import FormattedValue from './utils/FormattedValue';

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
    const unit = this.metadata.unit;
    let displayText = null;
    if (csData && csData.longestDiameter && csData.shortestDiameter) {
      displayText = (
        <>
          <FormattedValue
            prefix={'L'}
            value={csData.longestDiameter}
            suffix={unit}
          />
          <FormattedValue
            prefix={'W'}
            value={csData.shortestDiameter}
            suffix={unit}
          />
        </>
      );
    }
    return displayText;
  }

  generateDataObject() {
    const { length, unit, handles } = this.csData;
    this._xnat.data = {
      length,
      unit,
      handles: { ...handles },
    };
    return super.generateDataObject();
  }
}
