import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';
import showNotification from '../../../components/common/showNotification';

export default class MeasurementExportMenu extends React.Component {
  static propTypes = {
    onExportComplete: PropTypes.func.isRequired,
    onExportCancel: PropTypes.func.isRequired,
    workingCollection: PropTypes.object.isRequired,
  };

  constructor(props = {}) {
    super(props);

    this._cancelablePromises = [];

    const { workingCollection } = props;
    this._measurements = workingCollection.measurements;
    const { name } = workingCollection.metadata;
    const selectedCheckboxes = [];
    this._measurements.forEach(() => selectedCheckboxes.push(true));

    // Get from collection->xnatMetadata
    // const { dateTime, label } = generateDateTimeAndLabel('AIM');

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

  onCollectionNameChanged(evt) {}

  /**
   * async onExportButtonClick - Exports the current measurement collection to XNAT.
   *
   * @returns {null}
   */
  async onExportButtonClick() {
    const { measurementList, selectedCheckboxes } = this.state;
    const { SeriesInstanceUID, viewportData } = this.props;
    const roiCollectionName = this._roiCollectionName;

    // Check the name isn't empty, and isn't just whitespace.
    if (roiCollectionName.replace(/ /g, '').length === 0) {
      return;
    }

    const exportMask = [];

    let atLeastOneMeasurementSelected = false;

    for (let i = 0; i < measurementList.length; i++) {
      if (selectedCheckboxes[i]) {
        exportMask[measurementList[i].index] = true;
        atLeastOneMeasurementSelected = true;
      }
    }

    if (!atLeastOneMeasurementSelected) {
      return;
    }

    this.setState({ exporting: true });

    const roiExtractor = new RoiExtractor(SeriesInstanceUID);
    const roiContours = roiExtractor.extractROIContours(exportMask);
    const seriesInfo = getSeriesInfoForImageId(viewportData);

    const xnat_label = `${label}_S${seriesInfo.seriesNumber}`;

    const aw = new AIMWriter(roiCollectionName, xnat_label, dateTime);
    aw.writeImageAnnotationCollection(roiContours, seriesInfo);

    // Attempt export to XNAT. Lock ROIs for editing if the export is successful.
    const aimExporter = new AIMExporter(aw);

    await aimExporter
      .exportToXNAT()
      .then(success => {
        console.log('PUT successful.');

        //lockExportedROIs(
        lockStructureSet(
          exportMask,
          seriesInfo.seriesInstanceUid,
          roiCollectionName,
          xnat_label
        );

        clearCachedExperimentRoiCollections(aimExporter.experimentID);
        showNotification('Contour collection exported successfully', 'success');

        this.props.onExportComplete();
      })
      .catch(error => {
        console.log(error);
        // TODO -> Work on backup mechanism, disabled for now.
        //localBackup.saveBackUpForActiveSeries();

        const message = error.message || 'Unknown error';
        showNotification(message, 'error', 'Error exporting mask collection');

        this.props.onExportCancel();
      });
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
        <h5>Empty measurements collection. Export is not available.</h5>
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
              <th width="60%" className="left-aligned-cell">
                Measurement
              </th>
              <th width="20%" className="centered-cell">
                Value
              </th>
              <th width="10%" className="centered-cell">
                <input
                  type="checkbox"
                  checked={selectAllChecked}
                  value={selectAllChecked}
                  onChange={this.onChangeSelectAllCheckbox}
                />
                {' Export'}
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
          <h3>Export measurements collection</h3>
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
              onChange={this.onTextInputChange}
              placeholder="Unnamed ROI collection"
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
