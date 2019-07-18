import { Template } from "meteor/templating";
import { viewportUtils } from "../../../lib/viewportUtils";
import { getElementIfNotEmpty } from "../../../lib/getElementIfNotEmpty.js";
import { OHIF } from "meteor/ohif:core";
import { cornerstone } from "meteor/ohif:cornerstone";

/**
 * @author JamesAPetts
 */
// JamesAPetts
Template.smoothCheckbox.onCreated(() => {
  const instance = Template.instance();

  instance.data.smooth = new ReactiveVar(true);
});

Template.smoothCheckbox.helpers({
  isChecked() {
    Session.get("CornerstoneImageRendered" + this.viewportIndex);

    const smooth = this.smooth.get();
    const element = getElementIfNotEmpty(this.viewportIndex);

    if (!element) {
      return;
    }

    const enabledElement = cornerstone.getEnabledElement(element);

    if (smooth) {
      if (enabledElement.viewport.pixelReplication) {
        enabledElement.viewport.pixelReplication = false;
        cornerstone.updateImage(enabledElement.element);
      }

      return "checked";
    }

    if (!enabledElement.viewport.pixelReplication) {
      enabledElement.viewport.pixelReplication = true;
      cornerstone.updateImage(enabledElement.element);
    }

    return;
  }
});

Template.smoothCheckbox.events({
  /**
   * Toggles the smoothing of pixels on the current image.
   *
   */
  "click .js-smooth-check"(event) {
    this.smooth.set(!this.smooth.get());
  }
});
