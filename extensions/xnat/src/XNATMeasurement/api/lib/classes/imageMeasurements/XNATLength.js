import React from 'react';
import ImageMeasurement from './ImageMeasurement';
import { XNATToolTypes } from '../../../../measurement-tools';
import FormattedValue from './utils/FormattedValue';

export default class XNATLength extends ImageMeasurement {
  static get genericToolType() {
    return 'Length';
  }

  static get toolType() {
    return XNATToolTypes.LENGTH;
  }

  static get icon() {
    return 'xnat-measure-length';
  }

  constructor(isImported, props) {
    super(isImported, props);
  }

  get displayText() {
    const csData = this.csData;
    const unit = this.metadata.unit;
    let displayText = null;
    if (csData && csData.length && !isNaN(csData.length)) {
      displayText = (
        <FormattedValue value={csData.length.toFixed(2)} suffix={unit} />
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
