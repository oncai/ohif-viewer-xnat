import { Template } from "meteor/templating";
import { _ } from "meteor/underscore";
import { Session } from "meteor/session";
import { cornerstoneTools } from "meteor/ohif:cornerstone";

const modules = cornerstoneTools.store.modules;

import { OHIF } from "meteor/ohif:core";
import { thumbnailDragHandlers } from "../../../lib/thumbnailDragHandlers";

Template.thumbnailEntry.onCreated(() => {
  const instance = Template.instance();

  // Check if the thumbnails will be draggable or clickable
  const isIndexUndefined = _.isUndefined(instance.data.viewportIndex);
  instance.isDragAndDrop =
    isIndexUndefined && OHIF.uiSettings.leftSidebarDragAndDrop !== false;
});

Template.thumbnailEntry.events({
  // Event handlers for drag and drop
  "mousedown .thumbnailEntry"(event, instance) {
    const data = instance.data.thumbnail.stack;
    if (!instance.isDragAndDrop || event.button !== 0) return;
    thumbnailDragHandlers.thumbnailDragStartHandler(event, data);
  },

  "touchstart .thumbnailEntry"(event, instance) {
    const data = instance.data.thumbnail.stack;
    if (!instance.isDragAndDrop) return;
    thumbnailDragHandlers.thumbnailDragStartHandler(event, data);
  },

  "touchmove .thumbnailEntry"(event, instance) {
    if (!instance.isDragAndDrop) return;
    thumbnailDragHandlers.thumbnailDragHandler(event);
  },

  "touchend .thumbnailEntry"(event, instance) {
    const data = instance.data.thumbnail.stack;
    if (!instance.isDragAndDrop) return;
    thumbnailDragHandlers.thumbnailDragEndHandler(event, data);
  },

  // Event handlers for click (quick switch)
  "click .thumbnailEntry"(event, instance) {
    if (instance.isDragAndDrop) return;

    // Get the thumbnail stack data
    const data = instance.data.thumbnail.stack;

    // Get the viewport index
    let { viewportIndex } = instance.data;
    if (_.isUndefined(viewportIndex)) {
      viewportIndex = Session.get("activeViewport") || 0;
    }

    // Rerender the viewport using the clicked thumbnail data
    OHIF.viewerbase.layoutManager.rerenderViewportWithNewDisplaySet(
      viewportIndex,
      data
    );
  },

  // Event handlers for double click
  "dblclick .thumbnailEntry"(event, instance) {
    if (!instance.isDragAndDrop) return;

    // Get the active viewport index and total number of viewports...
    const viewportCount = OHIF.viewerbase.layoutManager.getNumberOfViewports();
    let viewportIndex = Session.get("activeViewport") || 0;
    if (viewportIndex >= viewportCount) {
      viewportIndex = viewportCount > 0 ? viewportCount - 1 : 0;
    }

    // Get the thumbnail stack data
    const data = instance.data.thumbnail.stack;

    // Rerender the viewport using the clicked thumbnail data
    OHIF.viewerbase.layoutManager.rerenderViewportWithNewDisplaySet(
      viewportIndex,
      data
    );
  }
});

Template.thumbnailEntry.helpers({
  draggableClass() {
    return Template.instance().isDragAndDrop ? "draggable" : "";
  },

  instanceNumber() {
    const thumbnail = Template.instance().data.thumbnail;
    if (!thumbnail) {
      return;
    }

    const stack = thumbnail.stack;
    if (!stack) {
      return;
    }

    //  No need to show instance number for single-frame images
    if (!stack.isMultiFrame) {
      return;
    }

    const firstImage = stack.images[0];
    if (!firstImage) {
      return;
    }

    return firstImage.instanceNumber;
  },

  // JamesAPetts
  paddedSeriesNumber(seriesDescription) {
    const stringArray = seriesDescription.split(" ");

    for (let i = 0; i < stringArray.length; i++) {
      let string = stringArray[i];

      if (string.length > 44) {
        string =
          string.substring(0, 22) +
          " " +
          string.substring(22, 44) +
          " " +
          string.substring(44, string.length);
      } else if (string.length > 22) {
        string =
          string.substring(0, 22) + " " + string.substring(44, string.length);
      }

      stringArray[i] = string;
    }

    return stringArray.join(" ");
  },
  hasROIContours() {
    Session.get("refreshRoiContourMenu");

    const instance = Template.instance();
    const seriesInstanceUid = instance.data.thumbnail.stack.seriesInstanceUid;
    const freehand3DModule = modules.freehand3D;

    const roiOnSeries = freehand3DModule.getters.series(seriesInstanceUid);

    if (!roiOnSeries) {
      return false;
    }

    const structureSetCollection = roiOnSeries.structureSetCollection;

    let hasRoi = false;

    for (let i = 0; i < structureSetCollection.length; i++) {
      const structureSetCollectionI = structureSetCollection[i];

      if (structureSetCollectionI.ROIContourCollection.length) {
        hasRoi = true;
        break;
      }
    }

    return hasRoi;
  },
  hasSegments() {
    Session.get("refreshSegmentationMenu");

    const instance = Template.instance();

    const seriesInstanceUid = instance.data.thumbnail.stack.seriesInstanceUid;
    const brushModule = modules.brush;

    const seriesMetadata = brushModule.getters.metadata(seriesInstanceUid);

    if (seriesMetadata && seriesMetadata.length) {
      console.log(seriesMetadata);

      return seriesMetadata.some(element => element !== undefined);
    }

    return false;
  }
});
