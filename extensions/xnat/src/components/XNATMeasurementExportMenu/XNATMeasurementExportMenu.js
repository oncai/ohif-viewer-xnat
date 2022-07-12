import React from 'react';
import PropTypes from 'prop-types';

import '../XNATRoiPanel.styl';

export default class XNATContourExportMenu extends React.Component {
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
    return <div>Measurement Export Menu</div>;
  }
}
