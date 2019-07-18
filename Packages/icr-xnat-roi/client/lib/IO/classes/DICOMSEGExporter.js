import { sessionMap } from "meteor/icr:series-info-provider";
import fetchCSRFToken from "../fetchCSRFToken.js";

const XMLWriter = require("xml-writer");

/**
 * @class DICOMSEGExporter - Exports a DICOM seg file to an XNAT ROICollection.
 */
export default class DICOMSEGExporter {
  constructor(segBlob, seriesInstanceUid, label, name) {
    this._payload = segBlob;
    this._seriesInstanceUID = seriesInstanceUid;

    this._projectID = sessionMap.getParentProject();
    this._experimentID = sessionMap.getScan(
      this._seriesInstanceUID,
      "experimentId"
    );

    this._label = label;
  }

  /**
   * exportToXNAT - Exports the DICOMSEG to XNAT.
   *
   * @returns {null}
   */
  async exportToXNAT() {
    const csrfToken = await fetchCSRFToken();
    const csrfTokenParameter = `XNAT_CSRF=${csrfToken}`;

    let putFailed = false;

    const putSegUrl =
      `${Session.get("rootUrl")}/xapi/roi/projects/${this._projectID}` +
      `/sessions/${this._experimentID}/collections/${
        this._label
      }?type=SEG&overwrite=false&${csrfTokenParameter}`;
    await this._PUT_uploadSeg(putSegUrl, this._payload).catch(error => {
      putFailed = true;
      console.log(error);
    });
    if (putFailed) {
      throw Error("PUT failed, check logs above.");
    }

    console.log("PUT succesful");

    return;
  }

  /**
   * _PUT_uploadSeg - PUTs the DICOM SEG object to the given url.
   *
   * @param  {string} url The url to PUT the DICOM SEG.
   * @param  {Blob} seg A Blob containing the DICOM SEG.
   * @returns {Promise} A promise that resolves on a successful PUT, and rejects
   *                    otherwise.
   */
  _PUT_uploadSeg(url, seg) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.onload = () => {
        console.log(`Request returned, status: ${xhr.status}`);
        if (xhr.status === 200 || xhr.status === 201) {
          resolve();
        } else {
          reject(xhr.responseText);
        }
      };

      xhr.onerror = () => {
        console.log(`Request returned, status: ${xhr.status}`);
        reject(xhr.responseText);
      };

      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", "application/octet-stream");
      xhr.send(seg);
    });
  }
}
