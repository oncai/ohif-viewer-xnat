import React from 'react';
import ImageMeasurement from './ImageMeasurement';
import { XNATToolTypes } from '../../../../measurement-tools';
import FormattedValue from './utils/FormattedValue';

export default class XNATAngle extends ImageMeasurement {
  static get genericToolType() {
    return 'Angle';
  }

  static get toolType() {
    return XNATToolTypes.ANGLE;
  }

  static get icon() {
    return 'xnat-measure-angle';
  }

  constructor(isImported, props) {
    super(isImported, props);
  }

  get displayText() {
    const csData = this.csData;
    const { angleUnit } = this.measurementUnits;
    let displayText = null;
    if (csData && csData.rAngle) {
      displayText = <FormattedValue value={csData.rAngle} suffix={angleUnit} />;
    }
    return displayText;
  }

  generateDataObject() {
    const dataObject = super.generateDataObject();

    const { rAngle, handles } = this.csData;
    dataObject.data = {
      rAngle,
      handles: { ...handles },
    };

    const values = dataObject.measurements;
    const { angleUnit } = this.measurementUnits;
    values.push({ name: 'angle', value: rAngle, unit: angleUnit });

    return dataObject;
  }
}
