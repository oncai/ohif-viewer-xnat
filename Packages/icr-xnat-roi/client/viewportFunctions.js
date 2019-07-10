import { OHIF } from "meteor/ohif:core";

OHIF.viewerbase.viewportUtils.showHelp = () => {
  const dialog = document.getElementById("showHelpDialog");

  dialog.show();
};
