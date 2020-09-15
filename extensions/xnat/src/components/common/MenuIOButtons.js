import React from 'react';

/**
 * @class MenuIOButtons - Renders Import and/or Export buttons if
 * this.props.ImportCallbackOrComponent and/or
 * this.props.ExportCallbackOrComponent are defined.
 */
export default class MenuIOButtons extends React.Component {
  constructor(props = {}) {
    super(props);
  }

  render() {
    const {
      ImportCallbackOrComponent,
      ExportCallbackOrComponent,
      onImportButtonClick,
      onExportButtonClick,
    } = this.props;

    if (!ImportCallbackOrComponent && !ExportCallbackOrComponent) {
      return null;
    }

    return (
      <div>
        {ImportCallbackOrComponent && (
          <button onClick={onImportButtonClick}>Import</button>
        )}
        {ExportCallbackOrComponent && (
          <button onClick={onExportButtonClick}>Export</button>
        )}
      </div>
    );
  }
}
