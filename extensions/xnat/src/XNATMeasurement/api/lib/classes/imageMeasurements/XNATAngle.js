import React from 'react';
import ImageMeasurement from './ImageMeasurement';
import { XNATToolTypes } from '../../../../measurement-tools';

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
    let displayText = null;
    if (csData && csData.rAngle) {
      displayText = (
        <div>
          <span>
            {csData.rAngle + String.fromCharCode(parseInt('00B0', 16))}
          </span>
        </div>
      );
    }
    return displayText;
  }

  generateDataObject() {
    const { rAngle, handles } = this.csData;
    this._xnat.data = {
      rAngle,
      handles: { ...handles },
    };
    return super.generateDataObject();
  }
}
