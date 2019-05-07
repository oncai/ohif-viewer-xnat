import { cornerstoneTools } from "meteor/ohif:cornerstone";
import { SeriesInfoProvider } from "meteor/icr:series-info-provider";

const modules = cornerstoneTools.store.modules;

function createNewVolumeCallback(name) {
  // Create and activate new ROIContour
  const activeSeriesInstanceUid = SeriesInfoProvider.getActiveSeriesInstanceUid();

  //Check if default structureSet exists for this series.
  if (!modules.freehand3D.getters.series(activeSeriesInstanceUid)) {
    modules.freehand3D.setters.series(activeSeriesInstanceUid);
  }

  modules.freehand3D.setters.ROIContourAndSetIndexActive(
    activeSeriesInstanceUid,
    "DEFAULT",
    name
  );
}

/**
 * Opens UI that allows user to chose a name for a new volume, and processes
 * the response.
 *
 */
export function createNewVolume() {
  const freehandSetNameDialog = document.getElementById(
    "freehandSetNameDialog"
  );
  const dialogData = Blaze.getData(freehandSetNameDialog);

  dialogData.freehandSetNameDialogDefaultName.set("");
  dialogData.freehandSetNameDialogCallback.set(createNewVolumeCallback);
  freehandSetNameDialog.showModal();
}

/**
 * Opens UI that allows user to change a volume's name,
 * and processes the response.
 *
 * @param {String} seriesInstanceUid  The UID of the series the ROIContour is associated with.
 * @param {String} structureSetUid    The UID of the structureSet the ROIContour belongs to.
 * @param {String} ROIContourUid      The UID of the ROIContourUid.
 *
 */
export function setVolumeName(
  seriesInstanceUid,
  structureSetUid,
  ROIContourUid
) {
  const ROIContour = modules.freehand3D.getters.ROIContour(
    seriesInstanceUid,
    structureSetUid,
    ROIContourUid
  );

  // Current name:
  let oldName;
  if (ROIContour.name) {
    oldName = ROIContour.name;
  } else {
    oldName = "";
  }

  function setVolumeNameCallback(name) {
    ROIContour.name = name;
  }

  const freehandSetNameDialog = document.getElementById(
    "freehandSetNameDialog"
  );
  const dialogData = Blaze.getData(freehandSetNameDialog);

  dialogData.freehandSetNameDialogDefaultName.set(oldName);
  dialogData.freehandSetNameDialogCallback.set(setVolumeNameCallback);
  freehandSetNameDialog.showModal();
}
