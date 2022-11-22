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
    // const csData = this.csData;
    // let displayText = null;
    // if (csData && csData.text) {
    //   displayText = (
    //     <div>
    //       <span>{csData.text}</span>
    //     </div>
    //   );
    // }
    // return displayText;
    return '-';
  }

  generateDataObject() {
    const dataObject = super.generateDataObject();

    const { text, handles } = this.csData;
    dataObject.data = {
      text,
      handles: { ...handles },
    };

    const values = dataObject.measurements;
    values.push({ name: 'arrow', comment: text, unit: '' });

    return dataObject;
  }
}
