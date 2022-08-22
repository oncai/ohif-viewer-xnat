import React from 'react';
import ImageMeasurement from './ImageMeasurement';
import { XNATToolTypes } from '../../../../measurement-tools';

export default class XNATArrowAnnotate extends ImageMeasurement {
  static get genericToolType() {
    return 'ArrowAnnotate';
  }

  static get toolType() {
    return XNATToolTypes.ARROW_ANNOTATE;
  }

  static get icon() {
    return 'xnat-measure-arrow';
  }

  constructor(isImported, props) {
    super(isImported, props);
  }

  get displayText() {
    const csData = this.csData;
    let displayText = null;
    if (csData && csData.text) {
      displayText = (
        <div>
          <span>{csData.text}</span>
        </div>
      );
    }
    return displayText;
  }

  generateDataObject() {
    const { text, handles } = this.csData;
    this._xnat.data = {
      text,
      handles: { ...handles },
    };
    return super.generateDataObject();
  }
}
