import React from 'react';
import PropTypes from 'prop-types';

export default class MeasurementImportMenu extends React.Component {
  static propTypes = {
    onImportComplete: PropTypes.any,
    onImportCancel: PropTypes.any,
    SeriesInstanceUID: PropTypes.any,
  };

  static defaultProps = {
    onImportComplete: undefined,
    onImportCancel: undefined,
    SeriesInstanceUID: undefined,
  };

  constructor(props = {}) {
    super(props);
  }

  render() {
    return <div>Measurement Import Menu</div>;
  }
}
