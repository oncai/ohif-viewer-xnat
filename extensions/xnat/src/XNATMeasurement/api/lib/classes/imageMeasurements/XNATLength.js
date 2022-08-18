import React from 'react';
import ImageMeasurement from './ImageMeasurement';
import { XNATToolTypes } from '../../../../measurement-tools';

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
    const { handles } = this._csMeasurementData;
    debugger;
    this._xnat.data = {
      handles: {},
    };
    super.generateDataObject();
  }
}
