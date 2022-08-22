import React from 'react';
import ImageMeasurement from './ImageMeasurement';
import { XNATToolTypes } from '../../../../measurement-tools';

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
    debugger;
    let displayText = null;
    if (csData && csData.length && !isNaN(csData.length)) {
      displayText = (
        <div>
          <span>{csData.length.toFixed(2)}</span>
          {csData.unit && (
            <span
              style={{ color: 'var(--text-secondary-color)', display: 'block' }}
            >
              {csData.unit}
            </span>
          )}
        </div>
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
