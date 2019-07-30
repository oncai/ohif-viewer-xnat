import React from "react";
import { SeriesInfoProvider } from "meteor/icr:series-info-provider";
import DICOMSEGWriter from "../../../lib/IO/classes/DICOMSEGWriter.js";
import DICOMSEGExporter from "../../../lib/IO/classes/DICOMSEGExporter.js";
import { cornerstoneTools } from "meteor/ohif:cornerstone";
import { sessionMap } from "meteor/icr:series-info-provider";
import { displayExportFailedDialog } from "../../../lib/dialogUtils/displayExportDialogs.js";
import awaitConfirmationDialog from "../../../lib/dialogUtils/awaitConfirmationDialog.js";
import generateDateTimeAndLabel from "../../../lib/util/generateDateTimeAndLabel.js";
import MaskExportListItem from "./MaskExportListItem.js";

import "./maskExportListDialogs.styl";

const brushModule = cornerstoneTools.store.modules.brush;

export default class MaskExportListDialog extends React.Component {
  constructor(props = {}) {
    super(props);

    this._cancelablePromises = [];

    const { dateTime, label } = generateDateTimeAndLabel("SEG");

    this.state = {
      segList: [],
      label,
      dateTime,
      exporting: false
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
    const { importMetadata, segList, label, dateTime } = this.state;
    const roiCollectionName = this._roiCollectionName;
    const seriesInstanceUid = this._seriesInstanceUid;

    // Check the name isn't empty, and isn't just whitespace.
    if (roiCollectionName.replace(/ /g, "").length === 0) {
      return;
    }

    if (importMetadata) {
      // importMetadata exists, therefore this is an edit.
      // Confirm user wants to make a new ROI Collection.
      const content = {
        title: `Warning`,
        body: `The edited ROI Collection will be saved as a new ROI Collection. Continue?`
      };

      const confirmed = await awaitConfirmationDialog(content);

      if (!confirmed) {
        return;
      }
    }

    this.setState({ exporting: true });

    // TODO DICOM or NIFTI will have different export channels here!
    // In the future we will check the metadata to check if the image is either NIFTI or DICOM.

    const seriesInfo = SeriesInfoProvider.getActiveSeriesInfo();

    // DICOM-SEG
    const dicomSegWriter = new DICOMSEGWriter(seriesInfo);
    const DICOMSegPromise = dicomSegWriter.write(roiCollectionName);

    DICOMSegPromise.then(segBlob => {
      const dicomSegExporter = new DICOMSEGExporter(
        segBlob,
        seriesInstanceUid,
        label,
        roiCollectionName
      );

      dicomSegExporter
        .exportToXNAT(false)
        .then(success => {
          console.log("PUT successful.");
          // Store that we've 'imported' a collection for this series.
          // (For all intents and purposes exporting it ends with an imported state,
          // i.e. not a fresh Mask collection.)

          brushModule.setters.importMetadata(seriesInstanceUid, {
            label: label,
            name: roiCollectionName,
            type: "SEG",
            modified: false
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
      if (typeof cancelablePromises[i].cancel === "function") {
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
    if (this.props.id === "NOT_ACTIVE") {
      return;
    }

    const seriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

    const importMetadata = brushModule.setters.importMetadata(
      seriesInstanceUid
    );

    this.setState({ importMetadata });

    this._seriesInstanceUid = seriesInstanceUid;

    const segMetadata =
      brushModule.state.segmentationMetadata[seriesInstanceUid];

    if (!segMetadata) {
      return;
    }

    const segList = [];

    for (let i = 0; i < segMetadata.length; i++) {
      if (segMetadata[i]) {
        segList.push({
          index: i,
          metadata: segMetadata[i]
        });
      }
    }

    let defaultName = "";

    if (segList && segList.length === 1) {
      defaultName = segList[0].metadata.SegmentLabel;
    }

    this._roiCollectionName = defaultName;

    this.setState({ segList });
  }

  render() {
    const { label, segList, exporting, importMetadata } = this.state;

    let segExportListBody;

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
              <MaskExportListItem
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
              <i className="fa fa-times-circle fa-2x" />
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
              defaultValue={this._roiCollectionName}
              tabIndex="-1"
              autoComplete="off"
            />

            <a
              className="btn btn-sm btn-primary"
              onClick={this.onExportButtonClick}
            >
              <svg stroke="#fff">
                <use xlinkHref="packages/icr_xnat-roi/assets/icons.svg#icon-xnat-export" />
              </svg>
            </a>
          </div>
        )}
      </div>
    );
  }
}
