import React from 'react';
import ImageMeasurement from './ImageMeasurement';
import { XNATToolTypes } from '../../../../measurement-tools';
import { FormattedValue } from '../../../../../elements';

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
    const { spatialUnit } = this.measurementUnits;
    let displayText = null;
    if (csData && csData.length && !isNaN(csData.length)) {
      displayText = (
        <FormattedValue value={csData.length.toFixed(2)} suffix={spatialUnit} />
      );
    }
    return displayText;
  }

  generateDataObject() {
    const dataObject = super.generateDataObject();

    const { length, handles } = this.csData;
    dataObject.data = {
      length,
      handles: { ...handles },
    };

    const values = dataObject.measurements;
    const { spatialUnit } = this.measurementUnits;
    values.push({ name: 'length', value: length, unit: spatialUnit });

    return dataObject;
  }
}
