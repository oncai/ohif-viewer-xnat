import React from 'react';
import MaskImporter from '../../utils/IO/classes/MaskImporter';
import fetchJSON from '../../utils/IO/fetchJSON.js';
import fetchArrayBuffer from '../../utils/IO/fetchArrayBuffer.js';
import cornerstoneTools from 'cornerstone-tools';
import sessionMap from '../../utils/sessionMap';
import { utils } from '@ohif/core';
import { Icon } from '@ohif/ui';

import '../XNATRoiPanel.styl';

const { studyMetadataManager } = utils;

const segmentationModule = cornerstoneTools.getModule('segmentation');

const _getFirstImageIdFromSeriesInstanceUid = seriesInstanceUid => {
  const studies = studyMetadataManager.all();
  for (let i = 0; i < studies.length; i++) {
    const study = studies[i];
    const displaySets = study.getDisplaySets();

    for (let j = 0; j < displaySets.length; j++) {
      const displaySet = displaySets[j];

      if (displaySet.SeriesInstanceUID === seriesInstanceUid) {
        return displaySet.images[0].getImageId();
      }
    }
  }

  const studyMetadata = studyMetadataManager.get(studyInstanceUid);
  const displaySet = studyMetadata.findDisplaySet(
    displaySet => displaySet.SeriesInstanceUID === seriesInstanceUid
  );
  return displaySet.images[0].getImageId();
};

const overwriteConfirmationContent = {
  title: `Warning`,
  body: `
    Loading in another Segmentation will overwrite existing segmentation data. Are you sure
    you want to do this?
  `,
};

export default class XNATSegmentationImportMenu extends React.Component {
  constructor(props = {}) {
    super(props);

    this.state = {
      scanSelected: 0,
      segmentationSelected: 0,
      importListReady: false,
      importList: [],
      importing: false,
      progressText: '',
      importProgress: 0,
    };

    this._cancelablePromises = [];
    // TODO -> Re add NIFTI support. This should really be done in a complete way with cornerstoneNiftiImageLoader
    this._validTypes = ['SEG'];
    this.onImportButtonClick = this.onImportButtonClick.bind(this);
    this.onCloseButtonClick = this.onCloseButtonClick.bind(this);
    this._collectionEligibleForImport = this._collectionEligibleForImport.bind(
      this
    );
    this.onSelectedScanChange = this.onSelectedScanChange.bind(this);
    this.onChangeRadio = this.onChangeRadio.bind(this);

    this._hasExistingMaskData = this._hasExistingMaskData.bind(this);
    this._updateImportingText = this._updateImportingText.bind(this);

    this.updateProgress = this.updateProgress.bind(this);
  }

  updateProgress(percent) {
    this.setState({ importProgress: percent });
  }

  /**
   * onSelectedScanChange - Update the scanSelected state.
   *
   * @param  {Object} evt  The event.
   * @returns {null}
   */
  onSelectedScanChange(evt) {
    const val = evt.target.value;

    this.setState({ scanSelected: val });
  }

  /**
   * onCloseButtonClick - Cancel the import and switch back to the
   * SegmentationMenu view.
   *
   * @returns {null}
   */
  onCloseButtonClick() {
    this.props.onImportCancel();
  }

  /**
   * onChangeRadio - Update the segmentationSelected index on radio input.
   *
   * @param  {Object} evt   The event.
   * @param  {number} index The index of the radio button.
   * @returns {null}
   */
  onChangeRadio(evt, index) {
    this.setState({ segmentationSelected: index });
  }

  /**
   * async onImportButtonClick - Import the mask after a possible overwrite confirmation.
   *
   * @returns {null}
   */
  async onImportButtonClick() {
    const { importList, scanSelected, segmentationSelected } = this.state;
    const scan = importList[scanSelected];

    const firstImageId = _getFirstImageIdFromSeriesInstanceUid(
      scan.referencedSeriesInstanceUid
    );

    if (this._hasExistingMaskData(firstImageId)) {
      console.log('TODO: Currently overwrite existing data.');
      // confirmed = await awaitConfirmationDialog(overwriteConfirmationContent);

      // if (!confirmed) {
      //   return;
      // }
    }

    this._updateImportingText('');
    this.setState({ importing: true });

    this._importRoiCollection(scan.segmentations[segmentationSelected], scan);
  }

  /**
   * _hasExistingMaskData - Check if we either have an import
   *                        (quicker to check), or we have some data.
   *
   * @returns {boolean}  Whether mask data exists.
   */
  _hasExistingMaskData(firstImageId) {
    if (segmentationModule.getters.importMetadata(firstImageId)) {
      return true;
    }

    const brushStackState = segmentationModule.state.series[firstImageId];

    if (!brushStackState) {
      return false;
    }

    const labelmap3D =
      brushStackState.labelmaps3D[brushStackState.activeLabelmapIndex];

    if (!labelmap3D) {
      return false;
    }

    return labelmap3D.metadata.some(data => data !== undefined);
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
   * componentDidMount - On mounting, fetch a list of available projects from XNAT.
   *
   * @returns {type}  description
   */
  componentDidMount() {
    if (this.props.id === 'NOT_ACTIVE') {
      this.setState({ importListReady: true });

      return;
    }

    const { viewportData } = this.props;

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
            let referencedSeriesNumberList = importList.find(
              element =>
                element.referencedSeriesNumber ===
                  referencedScan.seriesNumber &&
                element.experimentLabel === referencedScan.experimentLabel
            );

            if (!referencedSeriesNumberList) {
              importList.push({
                index: importList.length,
                referencedSeriesNumber: referencedScan.seriesNumber,
                referencedSeriesInstanceUid: referencedScan.seriesInstanceUid,
                experimentLabel: referencedScan.experimentLabel,
                experimentId: referencedScan.experimentId,
                segmentations: [],
              });

              referencedSeriesNumberList = importList[importList.length - 1];
            }

            referencedSeriesNumberList.segmentations.push({
              collectionType: data_fields.collectionType,
              label: data_fields.label,
              name: data_fields.name,
              date: data_fields.date,
              time: data_fields.time,
              getFilesUri: `/data/archive/experiments/${data_fields.imageSession_ID}/assessors/${data_fields.ID}/files?format=json`,
            });
          }
        });

        const activeSeriesInstanceUid = viewportData.seriesInstanceUid;

        const scanSelected = importList.findIndex(
          scan => scan.referencedSeriesInstanceUid === activeSeriesInstanceUid
        );

        this.setState({
          importList,
          importListReady: true,
          scanSelected: scanSelected !== -1 ? scanSelected : 0,
          segmentationSelected: 0,
        });
      });
    });
  }

  /**
   * _updateImportingText - Updates the progressText state.
   *
   * @param  {string} roiCollectionLabel The label of the ROI Collection.
   * @returns {null}
   */
  _updateImportingText(roiCollectionLabel) {
    this.setState({
      progressText: roiCollectionLabel,
    });
  }

  /**
   * async _importRoiCollection - Imports a segmentation.
   *
   * @param  {Object} segmentation The segmentation JSON catalog fetched from XNAT.
   * @param  {Object} scan         The scan to import onto.
   * @returns {null}
   */
  async _importRoiCollection(segmentation, scan) {
    // The URIs fetched have an additional /, so remove it.
    const getFilesUri = segmentation.getFilesUri.slice(1);

    const roiList = await fetchJSON(getFilesUri).promise;
    const result = roiList.ResultSet.Result;

    // Reduce count if no associated file is found (nothing to import, badly deleted roiCollection).
    if (result.length === 0) {
      this.props.onImportCancel();

      return;
    }

    // Retrieve each ROI from the list that has the same collectionType as the collection.
    // In an ideal world this should always be 1, and any other resources -- if any -- are differently formated representations of the same data, but things happen.
    for (let i = 0; i < result.length; i++) {
      const fileType = result[i].collection;
      if (fileType === segmentation.collectionType) {
        this._getAndImportFile(result[i].URI, segmentation, scan);
      }
    }
  }

  /**
   * async _getAndImportFile - Imports the file from the REST url and loads it into
   *                     cornerstoneTools toolData.
   *
   * @param  {string} uri             The REST URI of the file.
   * @param  {object} segmentation    An object describing the roiCollection to
   *                                  import.
   * @param  {object} scan            The scan to import onto.
   * @returns {null}
   */
  async _getAndImportFile(uri, segmentation, scan) {
    // The URIs fetched have an additional /, so remove it.
    uri = uri.slice(1);

    const seriesInstanceUid = scan.referencedSeriesInstanceUid;
    const maskImporter = new MaskImporter(
      seriesInstanceUid,
      this.updateProgress
    );

    const firstImageId = _getFirstImageIdFromSeriesInstanceUid(
      seriesInstanceUid
    );

    switch (segmentation.collectionType) {
      case 'SEG':
        this._updateImportingText(segmentation.name);

        // Store that we've imported a collection for this series.
        segmentationModule.setters.importMetadata(firstImageId, {
          label: segmentation.label,
          type: 'SEG',
          name: segmentation.name,
          modified: false,
        });

        const segArrayBuffer = await fetchArrayBuffer(uri).promise;

        await maskImporter.importDICOMSEG(segArrayBuffer);

        this.props.onImportComplete();
        break;

      case 'NIFTI':
        this._updateImportingText(segmentation.name);

        // Store that we've imported a collection for this series.
        segmentationModule.setters.importMetadata(firstImageId, {
          label: segmentation.label,
          type: 'NIFTI',
          name: segmentation.name,
          modified: false,
        });

        const niftiArrayBuffer = await fetchArrayBuffer(uri).promise;

        maskImporter.importNIFTI(niftiArrayBuffer);
        this.props.onImportComplete();
        break;

      default:
        console.error(
          `MaskImportListDialog._getAndImportFile not configured for filetype: ${fileType}.`
        );
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

    const collectionType = item.data_fields.collectionType;

    if (!this._validTypes.some(type => type === collectionType)) {
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

  render() {
    const {
      scanSelected,
      segmentationSelected,
      importList,
      importListReady,
      importing,
      progressText,
      importProgress,
    } = this.state;

    let importBody;

    if (importListReady) {
      if (importing) {
        importBody = (
          <>
            <h4>{progressText}</h4>
            <h4>{`Loading Data: ${importProgress} %`}</h4>
          </>
        );
      } else if (importList.length === 0) {
        importBody = <p>No data to import.</p>;
      } else {
        importBody = (
          <>
            {/*<select*/}
            {/*  // className="form-themed form-control"*/}
            {/*  style={{ width: '100%', height: 30, marginBottom: 10 }}*/}
            {/*  onChange={this.onSelectedScanChange}*/}
            {/*  value={scanSelected}*/}
            {/*>*/}
            {/*  {importList.map(scan => (*/}
            {/*    <option*/}
            {/*      key={scan.referencedSeriesInstanceUid}*/}
            {/*      value={scan.index}*/}
            {/*    >{`${scan.experimentLabel} - ${scan.referencedSeriesNumber}`}</option>*/}
            {/*  ))}*/}
            {/*</select>*/}

            <table className="collectionTable">
              <thead>
                <tr>
                  <th width="5%" className="centered-cell" />
                  <th width="45%">Name</th>
                  <th width="20%">Timestamp</th>
                  <th width="30%">
                    Referenced Scan
                    <select
                      onChange={this.onSelectedScanChange}
                      value={scanSelected}
                      style={{ display: 'block', width: '100%' }}
                    >
                      {importList.map(roiCollection => (
                        <option
                          key={roiCollection.referencedSeriesInstanceUid}
                          value={roiCollection.index}
                        >
                          {`${roiCollection.referencedSeriesNumber}`}
                        </option>
                      ))}
                    </select>
                  </th>
                </tr>
              </thead>
              <tbody>
                {importList[scanSelected].segmentations.map(
                  (roiCollection, index) => (
                    <tr key={roiCollection.label}>
                      <td className="centered-cell">
                        <input
                          // className="mask-import-list-item-check"
                          type="radio"
                          name="sync"
                          onChange={evt => this.onChangeRadio(evt, index)}
                          checked={
                            segmentationSelected === index ? true : false
                          }
                          value={segmentationSelected === index ? true : false}
                        />
                      </td>
                      <td>{roiCollection.name}</td>
                      <td>{`${roiCollection.date} ${roiCollection.time}`}</td>
                      <td className="centered-cell">{`${importList[scanSelected].referencedSeriesNumber}`}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </>
        );
      }
    } else {
      importBody = <h1 style={{ textAlign: 'center' }}>...</h1>;
    }

    return (
      <div className="xnatPanel">
        <div className="panelHeader">
          <h3>Import mask-based ROI collections</h3>
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
