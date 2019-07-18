/**
 * showProgressDialog - opens the progress dialog and displays the content given.
 *
 * @param  {object} content An object containing the notificationText and progressText.
 * @returns {null}
 */
function showProgressDialog(content) {
  const dialog = document.getElementById("ioProgress");
  if (content) {
    updateProgressDialog(content);
  }

  dialog.showModal();
}

/**
 * closeProgressDialog - Closes the progress dialog.
 *
 * @returns {null}
 */
function closeProgressDialog() {
  const dialog = document.getElementById("ioProgress");

  dialog.close();
}

/**
 * updateProgressDialog - Updates the content of the progress dialog.
 *
 * @param  {object} content An object containing the notificationText and progressText.
 * @returns {null}
 */
function updateProgressDialog(content) {
  if (content.notificationText) {
    document.getElementById("ioNotificationText").innerHTML =
      content.notificationText;
  }

  document.getElementById("ioProgressText").innerHTML = content.progressText
    ? content.progressText
    : `<i class="fa fa-spin fa-circle-o-notch fa-fw">`;
}

export default {
  show: showProgressDialog,
  close: closeProgressDialog,
  update: updateProgressDialog
};
