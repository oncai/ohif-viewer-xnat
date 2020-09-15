import React from 'react';
import PropTypes from 'prop-types';
import RoiImporter from '../../utils/IO/classes/RoiImporter';
import fetchJSON from '../../utils/IO/fetchJSON.js';
import fetchXML from '../../utils/IO/fetchXML.js';
import fetchArrayBuffer from '../../utils/IO/fetchArrayBuffer.js';
import cornerstoneTools from 'cornerstone-tools';
import sessionMap from '../../utils/sessionMap';
import { Icon } from '@ohif/ui';

import '../XNATRoiPanel.styl';

const modules = cornerstoneTools.store.modules;

export default class XNATContourImportMenu extends React.Component {
  static propTypes = {
    onImportComplete: PropTypes.any,
    onImportCancel: PropTypes.any,
    SeriesInstanceUID: PropTypes.any,
    viewportData: PropTypes.any,
  };

  static defaultProps = {
    onImportComplete: undefined,
    onImportCancel: undefined,
    SeriesInstanceUID: undefined,
    viewportData: undefined,
  };

  constructor(props = {}) {
    super(props);

    const selectedCheckboxes = [];

    this.state = {
      selectAllChecked: true,
      selectedCheckboxes,
      importListReady: false,
      importList: [],
      importing: false,
      progressText: '',
    };

    this._cancelablePromises = [];
    this._validTypes = ['AIM', 'RTSTRUCT'];

    this.onChangeCheckbox = this.onChangeCheckbox.bind(this);
    this.onChangeSelectAllCheckbox = this.onChangeSelectAllCheckbox.bind(this);
    this.onImportButtonClick = this.onImportButtonClick.bind(this);
    this.onCloseButtonClick = this.onCloseButtonClick.bind(this);
    this._getVolumeManagementLabels = this._getVolumeManagementLabels.bind(
      this
    );
    this._collectionEligibleForImport = this._collectionEligibleForImport.bind(
      this
    );
    this._updateImportingText = this._updateImportingText.bind(this);
    this._incrementNumCollectionsParsed = this._incrementNumCollectionsParsed.bind(
      this
    );
  }

  /**
   * onCloseButtonClick - Closes the dialog.
   *
   * @returns {null}
   */
  onCloseButtonClick() {
    this.props.onImportCancel();
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
   * async onImportButtonClick - Exports the current mask to XNAT.
   *
   * @returns {null}
   */
  onImportButtonClick() {
    const { importList, selectedCheckboxes } = this.state;

    this._numCollectionsParsed = 0;
    this._numCollectionsToParse = 0;

    for (let i = 0; i < importList.length; i++) {
      if (selectedCheckboxes[i]) {
        this._numCollectionsToParse++;
      }
    }

    if (this._numCollectionsToParse === 0) {
      return;
    }

    this._updateImportingText('');
    this.setState({ importing: true });

    for (let i = 0; i < importList.length; i++) {
      if (selectedCheckboxes[i]) {
        this._importRoiCollection(importList[i]);
      }
    }
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

  /**
   * componentDidMount - On mounting, fetch a list of available ROICollections from XNAT.
   *
   * @returns {type}  description
   */
  componentDidMount() {
    //ToDo: do we need this?
    // if (this.props.id === 'NOT_ACTIVE') {
    //   this.setState({ importListReady: true });
    //   return;
    // }

    const sessions = sessionMap.getSession();

    this._subjectId = sessionMap.getSubject();
    this._projectId = sessionMap.getProject();

    const promises = [];

    for (let i = 0; i < sessions.length; i++) {
      const experimentId = sessions[i].experimentId;

      const cancelablePromise = fetchJSON(
        `data/archive/projects/${this._projectId}/subjects/${this._subjectId}/experiments/${experimentId}/assessors?format=json`
      );
      promises.push(cancelablePromise.promise);
      this._cancelablePromises.push(cancelablePromise);
    }

    this._volumeManagementLabels = this._getVolumeManagementLabels();

    Promise.all(promises).then(sessionAssessorLists => {
      const roiCollectionPromises = [];

      for (let i = 0; i < sessionAssessorLists.length; i++) {
        const sessionAssessorList = sessionAssessorLists[i];

        const assessors = sessionAssessorList.ResultSet.Result;

        if (
          !assessors.some(
            assessor => assessor.xsiType === 'icr:roiCollectionData'
          )
        ) {
          continue;
        }

        const experimentId = assessors[0].session_ID;

        for (let i = 0; i < assessors.length; i++) {
          if (assessors[i].xsiType === 'icr:roiCollectionData') {
            const cancelablePromise = fetchJSON(
              `data/archive/projects/${this._projectId}/subjects/${this._subjectId}/experiments/${experimentId}/assessors/${assessors[i].ID}?format=json`
            );

            this._cancelablePromises.push(cancelablePromise);

            roiCollectionPromises.push(cancelablePromise.promise);
          }
        }
      }

      if (!roiCollectionPromises.length) {
        this.setState({ importListReady: true });

        return;
      }

      const importList = [];

      Promise.all(roiCollectionPromises).then(promisesJSON => {
        promisesJSON.forEach(roiCollectionInfo => {
          const data_fields = roiCollectionInfo.items[0].data_fields;

          const referencedScan = this._getReferencedScan(roiCollectionInfo);

          if (
            referencedScan &&
            this._collectionEligibleForImport(roiCollectionInfo)
          ) {
            importList.push({
              collectionType: data_fields.collectionType,
              label: data_fields.label,
              experimentId: data_fields.imageSession_ID,
              experimentLabel: referencedScan.experimentLabel,
              referencedSeriesInstanceUid: referencedScan.seriesInstanceUid,
              referencedSeriesNumber: referencedScan.seriesNumber,
              name: data_fields.name,
              getFilesUri: `data/archive/experiments/${data_fields.imageSession_ID}/assessors/${data_fields.ID}/files?format=json`,
            });
          }
        });

        const selectedCheckboxes = [];

        for (let i = 0; i < importList.length; i++) {
          selectedCheckboxes.push(true);
        }

        this.setState({
          importList,
          importListReady: true,
          selectedCheckboxes,
        });
      });
    });
  }

  /**
   * _updateImportingText - Update the importing text.
   *
   * @param  {string} roiCollectionLabel The lable of the ROI Collection.
   * @returns {null}
   */
  _updateImportingText(roiCollectionLabel) {
    this.setState({
      progressText: `${roiCollectionLabel} ${this._numCollectionsParsed}/${this._numCollectionsToParse}`,
    });
  }

  /**
   * async _importRoiCollection - Fetch and import the ROI collection from XNAT.
   *
   * @param  {Object} roiCollectionInfo The collection info for the ROI Collection.
   * @returns {null}
   */
  async _importRoiCollection(roiCollectionInfo) {
    const roiList = await fetchJSON(roiCollectionInfo.getFilesUri).promise;
    const result = roiList.ResultSet.Result;

    // Reduce count if no associated file is found (nothing to import, badly deleted roiCollection).
    if (result.length === 0) {
      this._incrementNumCollectionsParsed(roiCollectionInfo.name);

      return;
    }

    // Retrieve each ROI from the list that has the same collectionType as the collection.
    // In an ideal world this should always be 1, and any other resources -- if any -- are differently formated representations of the same data, but things happen.
    for (let i = 0; i < result.length; i++) {
      const fileType = result[i].collection;
      if (fileType === roiCollectionInfo.collectionType) {
        this._getAndImportFile(result[i].URI, roiCollectionInfo);
      }
    }
  }

  /**
   * async _getAndImportFile - Imports the file from the REST url and loads it into
   *                     cornerstoneTools toolData.
   *
   * @param  {string} uri             The REST URI of the file.
   * @param  {Object} collectionInfo  An object describing the roiCollection to
   *                                  import.
   * @returns {null}
   */
  async _getAndImportFile(uri, roiCollectionInfo) {
    const roiImporter = new RoiImporter(
      roiCollectionInfo.referencedSeriesInstanceUid
    );

    // The URIs fetched have an additional /, so remove it.
    uri = uri.slice(1);

    console.log('_getAndImportFile URI:');
    console.log(uri);

    switch (roiCollectionInfo.collectionType) {
      case 'AIM':
        this._updateImportingText(roiCollectionInfo.name);
        const aimFile = await fetchXML(uri).promise;

        if (!aimFile) {
          break;
        }

        roiImporter.importAIMfile(
          aimFile,
          roiCollectionInfo.name,
          roiCollectionInfo.label
        );
        break;
      case 'RTSTRUCT':
        this._updateImportingText(roiCollectionInfo.name);
        const rtStructFile = await fetchArrayBuffer(uri).promise;

        if (!rtStructFile) {
          break;
        }

        roiImporter.importRTStruct(
          rtStructFile,
          roiCollectionInfo.name,
          roiCollectionInfo.label
        );
        break;
      default:
        console.error(
          `RoiImportListDialog._getAndImportFile not configured for filetype: ${fileType}.`
        );
    }

    this._incrementNumCollectionsParsed(roiCollectionInfo.name);
  }

  /**
   * _incrementNumCollectionsParsed - Increases the number of collections
   * parsed, and closes the progress dialog if the collections have all been
   * imported.
   *
   * @returns {null}
   */
  _incrementNumCollectionsParsed(roiCollectionName) {
    this._updateImportingText(roiCollectionName);

    this._numCollectionsParsed++;

    if (this._numCollectionsParsed === this._numCollectionsToParse) {
      this.props.onImportComplete();
    }
  }

  /**
   * _collectionEligibleForImport - Returns true if the roiCollection references
   * the active series, and hasn't already been imported.
   *
   * @param  {Object} collectionInfoJSON  An object containing information about
   *                                      the collection.
   * @returns {boolean}                    Whether the collection is eligible
   *                                      for import.
   */
  _collectionEligibleForImport(collectionInfoJSON) {
    const item = collectionInfoJSON.items[0];
    const children = item.children;

    const collectionType = item.data_fields.collectionType;

    if (!this._validTypes.some(type => type === collectionType)) {
      return false;
    }

    // Check collection isn't already imported.
    const roiCollectionLabel = item.data_fields.label;

    const collectionAlreadyImported = this._volumeManagementLabels.some(
      label => label === roiCollectionLabel
    );

    if (collectionAlreadyImported) {
      return false;
    }

    return true;
  }

  /**
   * _getReferencedScan - If the collectionInfoJSON contains a scan from the sessionMap,
   * return that scan object from the sessionMap.
   *
   * @param  {Object} collectionInfoJSON The collection info fetched from XNAT.
   * @returns {Object|null}
   */
  _getReferencedScan(collectionInfoJSON) {
    const item = collectionInfoJSON.items[0];
    const children = item.children;

    // Check the collection references this seriesInstanceUid.
    for (let i = 0; i < children.length; i++) {
      if (children[i].field === 'references/seriesUID') {
        const referencedSeriesInstanceUidList = children[i].items;

        for (let j = 0; j < referencedSeriesInstanceUidList.length; j++) {
          const seriesInstanceUid =
            referencedSeriesInstanceUidList[j].data_fields.seriesUID;

          const scan = sessionMap.getScan(seriesInstanceUid);

          if (scan) {
            return scan;
          }
        }
      }
    }
  }

  /**
   * _getVolumeManagementLabels - Construct a list of roiCollections
   *                               already imported.
   *
   * @returns {string[]} An array of the labels of roiCollections already imported.
   */
  _getVolumeManagementLabels() {
    const freehand3DStore = modules.freehand3D;
    const structureSetUids = [];

    const seriesCollection = freehand3DStore.state.seriesCollection;

    seriesCollection.forEach(series => {
      const structureSetCollection = series.structureSetCollection;

      for (let i = 0; i < structureSetCollection.length; i++) {
        const label = structureSetCollection[i].uid;

        if (label !== 'DEFAULT') {
          structureSetUids.push(label);
        }
      }
    });

    return structureSetUids;
  }

  render() {
    const {
      selectAllChecked,
      selectedCheckboxes,
      importList,
      importListReady,
      importing,
      progressText,
    } = this.state;

    let importBody;

    if (importListReady) {
      if (importing) {
        importBody = (
          <>
            <h4>
              {progressText}
              {/*<i className="fa fa-spin fa-circle-o-notch fa-fw" />*/}
            </h4>
          </>
        );
      } else if (importList.length === 0) {
        importBody = <p>No data to import.</p>;
      } else {
        importBody = (
          <table className="collectionTable">
            <thead>
              <tr>
                <th width="10%" className="centered-cell">
                  <input
                    type="checkbox"
                    checked={selectAllChecked}
                    value={selectAllChecked}
                    onChange={this.onChangeSelectAllCheckbox}
                  />
                </th>
                <th width="50%">Name</th>
                <th width="40%">Referenced Scan</th>
              </tr>
            </thead>
            <tbody>
              {importList.map((roiCollection, index) => (
                <tr key={`${roiCollection.name}_${index}`}>
                  <td className="centered-cell">
                    <input
                      // className="roi-import-list-item-check"
                      type="checkbox"
                      name="sync"
                      onChange={evt => this.onChangeCheckbox(evt, index)}
                      checked={selectedCheckboxes[index]}
                      value={selectedCheckboxes[index]}
                    />
                  </td>
                  <td>{roiCollection.name}</td>
                  <td>
                    {`${roiCollection.experimentLabel} - ${roiCollection.referencedSeriesNumber}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      }
    } else {
      importBody = <h1 style={{ textAlign: 'center' }}>...</h1>;
    }

    return (
      <div className="xnatPanel">
        <div className="panelHeader">
          <h3>Import contour-based ROI collection</h3>
          {importing ? null : (
            <button className="small" onClick={this.onCloseButtonClick}>
              <Icon name="xnat-cancel" />
            </button>
          )}
        </div>
        <div className="roiCollectionBody limitHeight">{importBody}</div>
        <div className="roiCollectionFooter">
          {importing ? null : (
            <button onClick={this.onImportButtonClick}>
              <Icon name="xnat-import" />
              Import selected
            </button>
          )}
        </div>
      </div>
    );
  }
}
