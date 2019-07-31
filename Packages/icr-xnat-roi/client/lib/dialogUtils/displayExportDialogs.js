import messageDialog from "./messageDialog.js";
import { sessionMap } from "meteor/icr:series-info-provider";
import { SeriesInfoProvider } from "meteor/icr:series-info-provider";

/**
 * displayExportFailedDialog - Opens dialog to notify the user when an
 * export was unsuccessful.
 *
 * @param  {string} seriesInstanceUid The series instance UID of the image
 *                                    referenced by the annotations.
 * @returns {null}
 */
export function displayExportFailedDialog(seriesInstanceUid) {
  const { experimentLabel, projectId } = sessionMap.getScan(seriesInstanceUid);

  const title = "Export Failed";
  const body =
    `Export of ROIs to ${projectId}/${experimentLabel}` +
    " failed. This may be due a bad internet connection, or you may have been logged out. Please re-log on in another tab." +
    " The ROIs have not been locked, if you want to try exporting again after logging back in." +
    " If you have a good connection to XNAT and this problem persists, please contact" +
    " your XNAT administrator.";
  messageDialog(title, body);
}

/**
 * displayMaskNotModifiedDialog - Opens dialog to notify the user that the
 * Mask ROI Collection they are trying to export has not been modified from
 * the XNAT version.
 *
 * @param  {string} roiCollectionName The name off the roiCollection.
 * @returns {null}
 */
export function displayMaskNotModifiedDialog(roiCollectionName) {
  const title = "ROI Collection Not Modified";
  const body = `The segmentations in the ROI Collection "${roiCollectionName}" have not been modified, aborting export.`;

  messageDialog(title, body);
}

/**
 * displayNothingToExportDialog - Opens dialog to notify the user there are no
 *                                annotations of the specified type eligible
 *                                for export.
 *
 * @param  {string} type The annotation type.
 * @returns {null}
 */
export function displayNothingToExportDialog(type) {
  const title = "Nothing to Export";
  const body = `There are no unlocked ${type}s to export. Please refer to the More/Help/${type} menu for more information.`;

  messageDialog(title, body);
}
