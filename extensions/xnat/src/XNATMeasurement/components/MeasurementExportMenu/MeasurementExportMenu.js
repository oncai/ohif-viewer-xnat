import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';
import { xnatMeasurementApi, dataExchange } from '../../api';
import showNotification from '../../../components/common/showNotification';
import generateDateTimeAndLabel from '../../../utils/IO/helpers/generateDateAndTimeLabel';

export default class MeasurementExportMenu extends React.Component {
  static propTypes = {
    onExportComplete: PropTypes.func.isRequired,
    onExportCancel: PropTypes.func.isRequired,
    seriesCollection: PropTypes.object.isRequired,
  };

  constructor(props = {}) {
    super(props);

    this._cancelablePromises = [];

    const { workingCollection } = props.seriesCollection;
    this._measurements = workingCollection.measurements;
    const { name } = workingCollection.metadata;
    const selectedCheckboxes = [];
    this._measurements.forEach(() => selectedCheckboxes.push(true));

    const { label } = generateDateTimeAndLabel('MEAS');
    const { SeriesNumber } = workingCollection.internal;
    this._xnatCollectionLabel = label;
    if (SeriesNumber !== undefined) {
      this._xnatCollectionLabel += `_S${SeriesNumber}`;
    }

    this.state = {
      collectionName: name,
      selectedCheckboxes,
      selectAllChecked: true,
      exporting: false,
    };

    this.onChangeSelectAllCheckbox = this.onChangeSelectAllCheckbox.bind(this);
    this.onChangeCheckbox = this.onChangeCheckbox.bind(this);
    this.onCloseButtonClick = this.onCloseButtonClick.bind(this);
    this.onExportButtonClick = this.onExportButtonClick.bind(this);
    this.onCollectionNameChanged = this.onCollectionNameChanged.bind(this);
  }

  onCollectionNameChanged(evt) {
    const { workingCollection } = this.props.seriesCollection;
    const value = evt.target.value;
    workingCollection.metadata.name = value;
    this.setState({ collectionName: value });
  }

  /**
   * async onExportButtonClick - Exports the current measurement collection to XNAT.
   *
   * @returns {null}
   */
  async onExportButtonClick() {
    const { seriesCollection } = this.props;
    const { collectionName, selectedCheckboxes } = this.state;

    // Check the name isn't empty, and isn't just whitespace.
    if (collectionName.replace(/ /g, '').length === 0) {
      showNotification('A valid collection name is required.', 'warning');
      return;
    }

    const selectedMeasurements = [];

    let atLeastOneMeasurementSelected = false;

    for (let i = 0; i < selectedCheckboxes.length; i++) {
      if (selectedCheckboxes[i]) {
        selectedMeasurements.push(this._measurements[i]);
        atLeastOneMeasurementSelected = true;
      }
    }

    if (!atLeastOneMeasurementSelected) {
      showNotification('Please select one or more measurements.', 'warning');
      return;
    }

    this.setState({ exporting: true });

    try {
      const { workingCollection } = seriesCollection;
      const collectionObject = workingCollection.generateDataObject(
        selectedMeasurements
      );
      const serializedJson = JSON.stringify(collectionObject);
      await dataExchange.storeMeasurementCollection(serializedJson, {
        collectionLabel: this._xnatCollectionLabel,
        SeriesInstanceUID: workingCollection.imageReference.SeriesInstanceUID,
      });
      showNotification(
        'Measurement collection exported successfully.',
        'success'
      );

      // Lock measurement collection for editing if the export is successful.
      xnatMeasurementApi.lockExportedCollection(
        seriesCollection,
        collectionObject,
        selectedMeasurements
      );

      this.props.onExportComplete();
    } catch (error) {
      console.error(error);

      const message = error.message || 'Unknown error';
      showNotification(
        message,
        'error',
        'Error exporting measurement collection'
      );
    }
  }

  /**
   * onCloseButtonClick - Closes the dialog.
   *
   * @returns {null}
   */
  onCloseButtonClick() {
    this.props.onExportCancel();
  }

  /**
   * onChangeSelectAllCheckbox - Check all checkboxes.
   *
   * @param  {Object} evt The event.
   * @returns {null}
   */
  onChangeSelectAllCheckbox(evt) {
    const selectedCheckboxes = [...this.state.selectedCheckboxes];
    const checked = evt.target.checked;

    for (let i = 0; i < selectedCheckboxes.length; i++) {
      selectedCheckboxes[i] = checked;
    }

    this.setState({ selectAllChecked: evt.target.checked, selectedCheckboxes });
  }

  /**
   * onChangeCheckbox - Check/uncheck a checkbox.
   *
   * @param  {Object} evt   The event.
   * @param  {number} index number
   * @returns {null}
   */
  onChangeCheckbox(evt, index) {
    const selectedCheckboxes = [...this.state.selectedCheckboxes];

    selectedCheckboxes[index] = evt.target.checked;
    this.setState({ selectedCheckboxes });
  }

  /**
   * componentWillUnmount - If any promises are active, cancel them to avoid
   * memory leakage by referencing `this`.
   *
   * @returns {null}
   */
  componentWillUnmount() {
    const cancelablePromises = this._cancelablePromises;

    for (let i = 0; i < cancelablePromises.length; i++) {
      if (typeof cancelablePromises[i].cancel === 'function') {
        cancelablePromises[i].cancel();
      }
    }
  }

  render() {
    const {
      collectionName,
      selectedCheckboxes,
      selectAllChecked,
      exporting,
    } = this.state;

    const emptyCollection = this._measurements.length === 0;
    let exportListBody;

    if (emptyCollection) {
      exportListBody = (
        <h5>Empty measurement collection. Export is not available.</h5>
      );
    } else if (exporting) {
      exportListBody = (
        <>
          <h5>
            exporting {collectionName}
            ...
          </h5>
        </>
      );
    } else {
      exportListBody = (
        <table className="collectionTable">
          <thead>
            <tr>
              <th width="10%" className="centered-cell" />
              <th width="55%" className="left-aligned-cell">
                Measurement
              </th>
              <th width="20%" className="centered-cell">
                Value
              </th>
              <th width="15%" className="centered-cell">
                <span>Export</span>
                <input
                  type="checkbox"
                  checked={selectAllChecked}
                  value={selectAllChecked}
                  onChange={this.onChangeSelectAllCheckbox}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {this._measurements.map((measurement, index) => {
              const { metadata, internal } = measurement;
              const { uuid, name } = metadata;
              const { icon } = internal;
              return (
                <tr key={uuid}>
                  <td className="centered-cell">
                    <Icon name={icon} width="16px" height="16px" />
                  </td>
                  <td
                    className="left-aligned-cell"
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {name}
                  </td>
                  <td className="centered-cell">{measurement.displayText}</td>
                  <td className="centered-cell">
                    <input
                      type="checkbox"
                      onChange={evt => this.onChangeCheckbox(evt, index)}
                      checked={selectedCheckboxes[index]}
                      value={selectedCheckboxes[index]}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    }

    return (
      <div className="xnatPanel">
        <div className="panelHeader">
          <h3>Export measurement collection</h3>
          {!exporting && (
            <button className="small" onClick={this.onCloseButtonClick}>
              <Icon name="xnat-cancel" />
            </button>
          )}
        </div>

        <div className="roiCollectionBody limitHeight">{exportListBody}</div>

        {!exporting && !emptyCollection && (
          <div className="roiCollectionFooter">
            <label style={{ marginRight: 5 }}>Name</label>
            <input
              type="text"
              defaultValue={collectionName}
              onChange={this.onCollectionNameChanged}
              placeholder="Unnamed measurement collection"
              tabIndex="-1"
              autoComplete="off"
              style={{ flex: 1 }}
            />
            <button
              onClick={this.onExportButtonClick}
              style={{ marginLeft: 10 }}
            >
              <Icon name="xnat-export" />
              Export selected
            </button>
          </div>
        )}
      </div>
    );
  }
}
