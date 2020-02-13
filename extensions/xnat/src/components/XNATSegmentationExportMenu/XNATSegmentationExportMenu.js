import React from 'react';
import DICOMSEGWriter from '../../utils/IO/classes/DICOMSEGWriter';
import DICOMSEGExporter from '../../utils/IO/classes/DICOMSEGExporter.js';
import cornerstoneTools from 'cornerstone-tools';
import getSeriesInfoForImageId from '../../utils/IO/helpers/getSeriesInfoForImageId';
import generateDateTimeAndLabel from '../../utils/IO/helpers/generateDateAndTimeLabel';
import SegmentationExportListItem from './SegmentationExportListItem.js';
import getElementForFirstImageId from '../../utils/getElementFromFirstImageId';
import { Icon } from '@ohif/ui';

import './XNATSegmentationExportMenu.css';

const segmentationModule = cornerstoneTools.getModule('segmentation');

export default class XNATSegmentationExportMenu extends React.Component {
  constructor(props = {}) {
    super(props);

    this._cancelablePromises = [];

    const { dateTime, label } = generateDateTimeAndLabel('SEG');

    this.state = {
      segList: [],
      label,
      dateTime,
      exporting: false,
    };

    this.onCloseButtonClick = this.onCloseButtonClick.bind(this);
    this.onTextInputChange = this.onTextInputChange.bind(this);
    this.onExportButtonClick = this.onExportButtonClick.bind(this);
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
    const { label } = this.state;
    const { firstImageId, viewportData } = this.props;
    const roiCollectionName = this._roiCollectionName;

    // Check the name isn't empty, and isn't just whitespace.
    if (roiCollectionName.replace(/ /g, '').length === 0) {
      return;
    }

    this.setState({ exporting: true });

    const seriesInfo = getSeriesInfoForImageId(viewportData);
    const element = getElementForFirstImageId(firstImageId);

    // DICOM-SEG
    const dicomSegWriter = new DICOMSEGWriter(seriesInfo);
    const DICOMSegPromise = dicomSegWriter.write(roiCollectionName, element);

    DICOMSegPromise.then(segBlob => {
      const dicomSegExporter = new DICOMSEGExporter(
        segBlob,
        seriesInfo.seriesInstanceUid,
        label,
        roiCollectionName
      );

      dicomSegExporter
        .exportToXNAT(false)
        .then(success => {
          console.log('PUT successful.');
          // Store that we've 'imported' a collection for this series.
          // (For all intents and purposes exporting it ends with an imported state,
          // i.e. not a fresh Mask collection.)

          segmentationModule.setters.importMetadata(firstImageId, {
            label: label,
            name: roiCollectionName,
            type: 'SEG',
            modified: false,
          });

          this.props.onExportComplete();
        })
        .catch(error => {
          console.log(error);
          // TODO -> Work on backup mechanism, disabled for now.
          //localBackup.saveBackUpForActiveSeries();
          displayExportFailedDialog(seriesInstanceUid);
          this.props.onExportCancel();
        });
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
   * componentDidMount - On mount, fetch a list of available projects from XNAT.
   *
   * @returns {null}
   */
  componentDidMount() {
    const { firstImageId, labelmap3D } = this.props;

    if (!firstImageId || !labelmap3D) {
      return;
    }

    const importMetadata = segmentationModule.setters.importMetadata(
      firstImageId
    );

    const metadata = labelmap3D.metadata;

    if (!metadata) {
      return;
    }
    const segList = [];

    for (let i = 0; i < metadata.length; i++) {
      if (metadata[i]) {
        segList.push({
          index: i,
          metadata: metadata[i],
        });
      }
    }

    let defaultName = '';

    if (segList && segList.length === 1) {
      defaultName = segList[0].metadata.SegmentLabel;
    }

    this._roiCollectionName = defaultName;

    this.setState({ segList, importMetadata });
  }

  render() {
    const { label, segList, exporting, importMetadata } = this.state;

    let segExportListBody;

    let defaultName = '';

    if (segList && segList.length === 1) {
      defaultName = segList[0].metadata.SegmentLabel;
    }

    if (exporting) {
      segExportListBody = (
        <>
          <h5>
            exporting {this._roiCollectionName}
            <i className="fa fa-spin fa-circle-o-notch fa-fw" />
          </h5>
        </>
      );
    } else {
      segExportListBody = (
        <table className="peppermint-table">
          <tbody>
            {importMetadata ? (
              <tr className="mask-export-list-collection-info">
                <th className="left-aligned-cell">{importMetadata.name}</th>
                <th className="centered-cell">{importMetadata.label}</th>
                <th className="right-aligned-cell">{importMetadata.type}</th>
              </tr>
            ) : (
              <tr className="mask-export-list-collection-info">
                <th colSpan="3" className="left-aligned-cell">
                  New SEG ROI Collection
                </th>
              </tr>
            )}

            <tr>
              <th>Label</th>
              <th className="centered-cell">Category</th>
              <th className="centered-cell">Type</th>
            </tr>
            {segList.map(segment => (
              <SegmentationExportListItem
                key={segment.index}
                segIndex={segment.index}
                metadata={segment.metadata}
              />
            ))}
          </tbody>
        </table>
      );
    }

    return (
      <div className="mask-export-list-dialog">
        <div className="mask-export-list-header">
          <h3>Export Segmentations</h3>
          {!exporting && (
            <a
              className="mask-export-list-cancel btn btn-sm btn-secondary"
              onClick={this.onCloseButtonClick}
            >
              <Icon name="step-backward" />
            </a>
          )}
        </div>

        <hr />

        <div className="mask-export-list-body">{segExportListBody}</div>

        <hr />

        {!exporting && (
          <div className="mask-export-list-footer">
            <label>Name</label>
            <input
              name="segBuilderTextInput"
              className="form-themed form-control"
              onChange={this.onTextInputChange}
              type="text"
              defaultValue={defaultName}
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
