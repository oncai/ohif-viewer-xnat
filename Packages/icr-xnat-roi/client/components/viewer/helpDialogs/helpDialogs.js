import { Template } from "meteor/templating";

import "./helpDialogs.html";
import HelpDialog from "./ReactComponents/HelpDialog.js";

Template.helpDialogs.onRendered(() => {
  const instance = Template.instance();
  const id = "showHelpDialog";

  const dialog = instance.$("#" + id);
  instance.data.dialog = dialog;

  dialogPolyfill.registerDialog(dialog.get(0));
});

/**
 * Blaze wrapper around the React component.
 */
Template.helpDialogs.helpers({
  HelpDialog() {
    return HelpDialog;
  }
});
