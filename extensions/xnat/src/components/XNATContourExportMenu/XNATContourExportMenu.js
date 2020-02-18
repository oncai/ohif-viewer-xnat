import React from 'react';
import AIMWriter from '../../utils/IO/classes/AIMWriter';
import AIMExporter from '../../utils/IO/classes/AIMExporter.js';
import RoiExtractor from '../../utils/IO/classes/RoiExtractor.js';
import generateDateTimeAndLabel from '../../utils/IO/helpers/generateDateAndTimeLabel';
import cornerstoneTools from 'cornerstone-tools';
import getSeriesInfoForImageId from '../../utils/IO/helpers/getSeriesInfoForImageId';
import lockStructureSet from '../../utils/lockStructureSet';

import { Icon } from '@ohif/ui';

import './XNATContourExportMenu.css';

const modules = cornerstoneTools.store.modules;

export default class XNATContourExportMenu extends React.Component {
  constructor(props = {}) {
    super(props);

    this._cancelablePromises = [];

    const { dateTime, label } = generateDateTimeAndLabel('AIM');

    this.state = {
      roiContourList: [],
      selectedCheckboxes: [],
      selectAllChecked: true,
      label,
      dateTime,
      exporting: false,
    };

    this.onChangeSelectAllCheckbox = this.onChangeSelectAllCheckbox.bind(this);
    this.onChangeCheckbox = this.onChangeCheckbox.bind(this);
    this.onCloseButtonClick = this.onCloseButtonClick.bind(this);
    this.onExportButtonClick = this.onExportButtonClick.bind(this);
    this.onTextInputChange = this.onTextInputChange.bind(this);

    this._roiCollectionName = label;
  }

  /**
   * onTextInputChange - Updates the roiCollectionName on text input.
   *
   * @param  {Object} evt The event.
   * @returns {null}
   */
  onTextInputChange(evt) {
    this._roiCollectionName = evt.target.value;
  }

  /**
   * async onExportButtonClick - Exports the current mask to XNAT.
   *
   * @returns {null}
   */
  async onExportButtonClick() {
    const { roiContourList, selectedCheckboxes, label, dateTime } = this.state;
    const { seriesInstanceUid, viewportData } = this.props;
    const roiCollectionName = this._roiCollectionName;

    // Check the name isn't empty, and isn't just whitespace.
    if (roiCollectionName.replace(/ /g, '').length === 0) {
      return;
    }

    const exportMask = [];

    let atLeastOneRoiContourSelected = false;

    for (let i = 0; i < roiContourList.length; i++) {
      if (selectedCheckboxes[i]) {
        exportMask[roiContourList[i].index] = true;
        atLeastOneRoiContourSelected = true;
      }
    }

    if (!atLeastOneRoiContourSelected) {
      return;
    }

    this.setState({ exporting: true });

    const roiExtractor = new RoiExtractor(seriesInstanceUid);
    const roiContours = roiExtractor.extractROIContours(exportMask);
    const seriesInfo = getSeriesInfoForImageId(viewportData);

    const aw = new AIMWriter(roiCollectionName, label, dateTime);
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
          label
        );

        this.props.onExportComplete();
      })
      .catch(error => {
        console.log(error);
        // TODO -> Work on backup mechanism, disabled for now.
        //localBackup.saveBackUpForActiveSeries();
        this.props.onExportCancel();
        //displayExportFailedDialog(seriesInfo.seriesInstanceUid);
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
    const selectedCheckboxes = this.state.selectedCheckboxes;
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
    const selectedCheckboxes = this.state.selectedCheckboxes;

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

  componentDidMount() {
    if (this.props.id === 'NOT_ACTIVE') {
      return;
    }

    const { seriesInstanceUid } = this.props;
    const freehand3DModule = modules.freehand3D;
    let series = freehand3DModule.getters.series(seriesInstanceUid);

    if (!series) {
      freehand3DModule.setters.series(seriesInstanceUid);
      series = freehand3DModule.getters.series(seriesInstanceUid);
    }

    const defaultStructureSet = freehand3DModule.getters.structureSet(
      seriesInstanceUid
    );

    const ROIContourCollection = defaultStructureSet.ROIContourCollection;

    const roiContourList = [];

    for (let i = 0; i < ROIContourCollection.length; i++) {
      if (
        !ROIContourCollection[i] ||
        ROIContourCollection[i].polygonCount === 0
      ) {
        continue;
      }

      roiContourList.push({
        index: i,
        ROIContourReference: ROIContourCollection[i],
        structureSetReference: defaultStructureSet,
      });
    }

    const selectedCheckboxes = [];

    for (let i = 0; i < roiContourList.length; i++) {
      selectedCheckboxes.push(true);
    }

    let defaultName = '';

    if (roiContourList && roiContourList.length === 1) {
      defaultName = roiContourList[0].ROIContourReference.name;
    }

    this._roiCollectionName = defaultName;

    this.setState({ roiContourList, selectedCheckboxes });
  }

  render() {
    const {
      roiContourList,
      selectedCheckboxes,
      selectAllChecked,
      label,
      exporting,
    } = this.state;

    let roiExportListBody;

    let defaultName = '';

    if (roiContourList && roiContourList.length === 1) {
      defaultName = roiContourList[0].ROIContourReference.name;
    }

    if (exporting) {
      roiExportListBody = (
        <>
          <h5>
            exporting {this._roiCollectionName}
            ...
          </h5>
        </>
      );
    } else {
      roiExportListBody = (
        <table>
          <tbody>
            <tr>
              <th nowrap="true" className="left-aligned-cell">
                Name
              </th>
              <th>
                Export{' '}
                <input
                  type="checkbox"
                  checked={selectAllChecked}
                  value={selectAllChecked}
                  onChange={this.onChangeSelectAllCheckbox}
                />
              </th>
              <th>Contours</th>
            </tr>
            {roiContourList.map((roiContour, index) => (
              <tr key={`${roiContour.ROIContourReference.name}_${index}`}>
                <td className="left-aligned-cell">
                  <i
                    className="fa fa-square"
                    style={{ color: roiContour.ROIContourReference.color }}
                  />{' '}
                  {roiContour.ROIContourReference.name}
                </td>
                <td>
                  <input
                    type="checkbox"
                    onChange={evt => this.onChangeCheckbox(evt, index)}
                    checked={selectedCheckboxes[index]}
                    value={selectedCheckboxes[index]}
                  />
                </td>
                <td>{roiContour.ROIContourReference.polygonCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return (
      <div className="roi-export-list-dialog">
        <div className="roi-export-list-header">
          <h3>Export Contours</h3>
          {!exporting && (
            <a
              className="roi-export-list-cancel btn btn-sm btn-secondary"
              onClick={this.onCloseButtonClick}
            >
              <Icon name="step-backward" />
            </a>
          )}
        </div>

        <hr />

        <div className="roi-export-list-body">{roiExportListBody}</div>

        {!exporting && (
          <div className="roi-export-list-footer">
            <label>Name</label>
            <input
              className="form-themed form-control"
              type="text"
              defaultValue={defaultName}
              onChange={this.onTextInputChange}
              tabIndex="-1"
              autoComplete="off"
            />
            <a
              className="btn btn-sm btn-primary"
              onClick={this.onExportButtonClick}
            >
              <Icon name="save" />
            </a>
          </div>
        )}
      </div>
    );
  }
}
