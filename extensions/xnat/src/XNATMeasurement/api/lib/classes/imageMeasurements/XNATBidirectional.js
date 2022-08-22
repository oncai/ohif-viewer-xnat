import React from 'react';
import ImageMeasurement from './ImageMeasurement';
import { XNATToolTypes } from '../../../../measurement-tools';

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
