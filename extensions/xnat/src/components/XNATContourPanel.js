import React from 'react';
import cornerstoneTools from 'cornerstone-tools';
import MenuIOButtons from './common/MenuIOButtons.js';
import WorkingCollectionList from './XNATContourMenu/WorkingCollectionList.js';
import LockedCollectionsList from './XNATContourMenu/LockedCollectionsList.js';
import RoiContourSettings from './XNATContourMenu/RoiContourSettings.js';
import unlockStructureSet from '../utils/unlockStructureSet.js';
import onIOCancel from './common/helpers/onIOCancel.js';
import getSeriesInstanceUidFromViewport from '../utils/getSeriesInstanceUidFromViewport';
import XNATContourExportMenu from './XNATContourExportMenu/XNATContourExportMenu';

//import getActiveViewportEnabledElement from '../utils/getActiveViewportEnabledElement.js';
//import getSeriesInstanceUidFromEnabledElement from '../utils/getSeriesInstanceUidFromEnabledElement.js';

// TODO
// import style from './roiContourMenu.styl';

const modules = cornerstoneTools.store.modules;
const { EVENTS } = cornerstoneTools;

/**
 * @class XNATContourMenu - Renders a menu for importing, exporting, creating
 * and renaming ROI Contours. As well as setting configuration settings for
 * the Freehand3Dtool.
 */
export default class XNATContourMenu extends React.Component {
  constructor(props = {}) {
    super(props);

    const { viewports, activeIndex } = props;

    this.onNewRoiButtonClick = this.onNewRoiButtonClick.bind(this);
    this.onRoiChange = this.onRoiChange.bind(this);
    this.confirmUnlockOnUnlockClick = this.confirmUnlockOnUnlockClick.bind(
      this
    );
    this.onUnlockCancelClick = this.onUnlockCancelClick.bind(this);
    this.onUnlockConfirmClick = this.onUnlockConfirmClick.bind(this);
    this.onIOComplete = this.onIOComplete.bind(this);
    this.onIOCancel = onIOCancel.bind(this);
    this.getRoiContourList = this.getRoiContourList.bind(this);
    this.cornerstoneEventListenerHandler = this.cornerstoneEventListenerHandler.bind(
      this
    );
    this.addEventListeners = this.addEventListeners.bind(this);

    this.addEventListeners();

    const seriesInstanceUid = getSeriesInstanceUidFromViewport(
      viewports,
      activeIndex
    );

    let workingCollection = [];
    let lockedCollections = [];
    let activeROIContourIndex = 1;

    if (seriesInstanceUid) {
      const roiContourList = this.getRoiContourList(seriesInstanceUid);

      workingCollection = roiContourList.workingCollection;
      lockedCollections = roiContourList.lockedCollections;
      activeROIContourIndex = roiContourList.activeROIContourIndex;
    }

    this.state = {
      workingCollection,
      lockedCollections,
      unlockConfirmationOpen: false,
      roiCollectionToUnlock: '',
      activeROIContourIndex,
      importing: false,
      exporting: false,
      seriesInstanceUid,
    };
  }

  componentDidUpdate(prevProps) {
    const { viewports, activeIndex } = this.props;
    const { seriesInstanceUid } = this.state;

    if (
      viewports[activeIndex] &&
      viewports[activeIndex].seriesInstanceUid !== seriesInstanceUid
    ) {
      this.refreshRoiContourList(
        viewports[activeIndex] && viewports[activeIndex].seriesInstanceUid
      );
    }
  }

  componentWillUnmount() {
    cornerstoneTools.store.state.enabledElements.forEach(enabledElement => {
      enabledElement.removeEventListener(
        EVENTS.MEASUREMENT_REMOVED,
        this.cornerstoneEventListenerHandler
      );
      enabledElement.removeEventListener(
        EVENTS.MEASUREMENT_ADDED,
        this.cornerstoneEventListenerHandler
      );
      enabledElement.removeEventListener(
        'peppermintinterpolateevent',
        this.cornerstoneEventListenerHandler
      );
    });
  }

  cornerstoneEventListenerHandler() {
    this.refreshRoiContourList(this.seriesInstanceUid);
  }

  addEventListeners() {
    cornerstoneTools.store.state.enabledElements.forEach(enabledElement => {
      enabledElement.addEventListener(
        EVENTS.MEASUREMENT_REMOVED,
        this.cornerstoneEventListenerHandler
      );
      enabledElement.addEventListener(
        EVENTS.MEASUREMENT_ADDED,
        this.cornerstoneEventListenerHandler
      );
      enabledElement.addEventListener(
        'peppermintinterpolateevent',
        this.cornerstoneEventListenerHandler
      );
    });
  }

  /**
   * getRoiContourList - returns the workingCollection, lockedCollections
   * and th activeROIContourIndex.
   *
   * @returns {null}
   */
  getRoiContourList(seriesInstanceUid) {
    seriesInstanceUid = seriesInstanceUid || this.state.seriesInstanceUid;

    let workingCollection = [];
    let lockedCollections = [];
    let activeROIContourIndex = 0;

    if (seriesInstanceUid) {
      const freehand3DModule = modules.freehand3D;

      if (freehand3DModule.getters.series(seriesInstanceUid)) {
        activeROIContourIndex = freehand3DModule.getters.activeROIContourIndex(
          seriesInstanceUid
        );
      }

      workingCollection = this.constructor._workingCollection(
        seriesInstanceUid
      );
      lockedCollections = this.constructor._lockedCollections(
        seriesInstanceUid
      );
    }

    return {
      workingCollection,
      lockedCollections,
      activeROIContourIndex,
    };
  }

  /**
   * refreshRoiContourList - Grabs the ROI Contours from the freehand3D store and
   * populates state.
   *
   * @returns {null}
   */
  refreshRoiContourList(seriesInstanceUid) {
    const {
      workingCollection,
      lockedCollections,
      activeROIContourIndex,
    } = this.getRoiContourList(seriesInstanceUid);

    this.setState({
      workingCollection,
      lockedCollections,
      activeROIContourIndex,
      seriesInstanceUid,
    });
  }

  /**
   * onIOComplete - A callback executed on succesful completion of an
   * IO opperation. Recalculates the ROI Contour Collection state.
   *
   * @returns {type}  description
   */
  onIOComplete() {
    const seriesInstanceUid = this.state.seriesInstanceUid;
    const freehand3DStore = modules.freehand3D;
    let activeROIContourIndex = 0;

    if (modules.freehand3D.getters.series(seriesInstanceUid)) {
      activeROIContourIndex = freehand3DStore.getters.activeROIContourIndex(
        seriesInstanceUid
      );
    }

    const workingCollection = this.constructor._workingCollection(
      seriesInstanceUid
    );
    const lockedCollections = this.constructor._lockedCollections(
      seriesInstanceUid
    );

    this.setState({
      workingCollection,
      lockedCollections,
      activeROIContourIndex,
      importing: false,
      exporting: false,
    });
  }

  /**
   * onNewRoiButtonClick - Callback that adds a new ROIContour to the
   * active series.
   *
   * @returns {null}
   */
  onNewRoiButtonClick() {
    const seriesInstanceUid = this.state.seriesInstanceUid;

    const freehand3DStore = modules.freehand3D;
    let series = freehand3DStore.getters.series(seriesInstanceUid);

    if (!series) {
      freehand3DStore.setters.series(seriesInstanceUid);
      series = freehand3DStore.getters.series(seriesInstanceUid);
    }

    const activeROIContourIndex = freehand3DStore.setters.ROIContourAndSetIndexActive(
      seriesInstanceUid,
      'DEFAULT',
      'Unnamed Lesion'
    );

    const workingCollection = this.constructor._workingCollection(
      seriesInstanceUid
    );

    this.setState({ workingCollection, activeROIContourIndex });
  }

  /**
   * onRoiChange - Callback that changes the active ROI Contour being drawn.
   *
   * @param  {Number} roiContourIndex The index of the ROI Contour.
   * @returns {null}
   */
  onRoiChange(roiContourIndex) {
    const seriesInstanceUid = this.state.seriesInstanceUid;

    modules.freehand3D.setters.activeROIContourIndex(
      roiContourIndex,
      seriesInstanceUid
    );

    this.setState({ activeROIContourIndex: roiContourIndex });
  }

  /**
   * confirmUnlockOnUnlockClick - A callback that triggers confirmation of the
   * unlocking of an ROI Contour Collection.
   *
   * @param  {String} structureSetUid The UID of the structureSet.
   * @returns {null}
   */
  confirmUnlockOnUnlockClick(structureSetUid) {
    this.setState({
      unlockConfirmationOpen: true,
      roiCollectionToUnlock: structureSetUid,
    });
  }

  /**
   * onUnlockConfirmClick - A callback that unlocks an ROI Contour Collection and
   * moves the ROI Contours to the working collection.
   *
   * @returns {type}  description
   */
  onUnlockConfirmClick() {
    const { seriesInstanceUid, roiCollectionToUnlock } = this.state;

    unlockStructureSet(seriesInstanceUid, roiCollectionToUnlock);

    const workingCollection = this.constructor._workingCollection(
      seriesInstanceUid
    );
    const lockedCollections = this.constructor._lockedCollections(
      seriesInstanceUid
    );

    this.setState({
      unlockConfirmationOpen: false,
      workingCollection,
      lockedCollections,
    });
  }

  /**
   * onUnlockCancelClick - A callback that closes the unlock confirmation window
   * and aborts unlocking.
   *
   * @returns {null}
   */
  onUnlockCancelClick() {
    this.setState({ unlockConfirmationOpen: false });
  }

  /**
   * _workingCollection - Returns a list of the ROI Contours
   * in the working collection.
   *
   * @returns {object[]} An array of ROI Contours.
   */
  static _workingCollection(seriesInstanceUid) {
    const freehand3DStore = modules.freehand3D;

    let series = freehand3DStore.getters.series(seriesInstanceUid);

    if (!series) {
      freehand3DStore.setters.series(seriesInstanceUid);
      series = freehand3DStore.getters.series(seriesInstanceUid);
    }

    const structureSet = freehand3DStore.getters.structureSet(
      seriesInstanceUid
    );

    const ROIContourCollection = structureSet.ROIContourCollection;

    const workingCollection = [];

    for (let i = 0; i < ROIContourCollection.length; i++) {
      if (ROIContourCollection[i]) {
        workingCollection.push({
          index: i,
          metadata: ROIContourCollection[i],
        });
      }
    }

    return workingCollection;
  }

  /**
   * _lockedCollections - Returns a list of locked ROI Contour Collections.
   *
   * @returns {object} An array of locked ROI Contour Collections.
   */
  static _lockedCollections(seriesInstanceUid) {
    const freehand3DStore = modules.freehand3D;

    let series = freehand3DStore.getters.series(seriesInstanceUid);

    if (!series) {
      freehand3DStore.setters.series(seriesInstanceUid);
      series = freehand3DStore.getters.series(seriesInstanceUid);
    }

    const structureSetCollection = series.structureSetCollection;
    const lockedCollections = [];

    for (let i = 0; i < structureSetCollection.length; i++) {
      const structureSet = structureSetCollection[i];

      if (structureSet.uid === 'DEFAULT') {
        continue;
      }

      const ROIContourCollection = structureSet.ROIContourCollection;
      const ROIContourArray = [];

      for (let j = 0; j < ROIContourCollection.length; j++) {
        if (ROIContourCollection[j]) {
          ROIContourArray.push({
            index: j,
            metadata: ROIContourCollection[j],
          });
        }
      }

      lockedCollections.push({
        metadata: structureSet,
        ROIContourArray,
      });
    }

    return lockedCollections;
  }

  render() {
    const {
      workingCollection,
      lockedCollections,
      unlockConfirmationOpen,
      roiCollectionToUnlock,
      activeROIContourIndex,
      importing,
      exporting,
      seriesInstanceUid,
    } = this.state;

    const { ImportCallbackOrComponent, viewports, activeIndex } = this.props;
    const freehand3DStore = modules.freehand3D;

    let component;

    if (importing) {
      component = (
        <ImportCallbackOrComponent
          onImportComplete={this.onIOComplete}
          onImportCancel={this.onIOCancel}
        />
      );
    } else if (exporting) {
      component = (
        <XNATContourExportMenu
          onExportComplete={this.onIOComplete}
          onExportCancel={this.onIOCancel}
          seriesInstanceUid={seriesInstanceUid}
          seriesMetadata={viewports[activeIndex]}
        />
      );
    } else if (unlockConfirmationOpen) {
      const collection = freehand3DStore.getters.structureSet(
        seriesInstanceUid,
        roiCollectionToUnlock
      );

      const collectionName = collection.name;

      component = (
        <div>
          <div>
            <h5>Unlock</h5>
            <p>
              Unlock {collectionName} for editing? The ROIs will be moved to the
              Working ROI Collection.
            </p>
          </div>
          <div>
            <a
              className="btn btn-sm btn-primary"
              onClick={this.onUnlockConfirmClick}
            >
              <i className="fa fa fa-check-circle fa-2x" />
            </a>
            <a
              className="btn btn-sm btn-primary"
              onClick={this.onUnlockCancelClick}
            >
              <i className="fa fa fa-times-circle fa-2x" />
            </a>
          </div>
        </div>
      );
    } else {
      component = (
        <div
          style={{ padding: '15px', color: 'white' }}
          className="roi-contour-menu-component"
        >
          {/*  */}
          <div>
            <h3>ROI Contour Collections</h3>
            <MenuIOButtons
              ImportCallbackOrComponent={ImportCallbackOrComponent}
              ExportCallbackOrComponent={XNATContourExportMenu}
              onImportButtonClick={() => this.setState({ importing: true })}
              onExportButtonClick={() => this.setState({ exporting: true })}
            />
          </div>

          {/* CONTOUR LIST */}
          <div className="roi-contour-menu-collection-list-body">
            <table className="peppermint-table">
              <tbody>
                {seriesInstanceUid && (
                  <WorkingCollectionList
                    workingCollection={workingCollection}
                    activeROIContourIndex={activeROIContourIndex}
                    onRoiChange={this.onRoiChange}
                    onNewRoiButtonClick={this.onNewRoiButtonClick}
                    seriesInstanceUid={seriesInstanceUid}
                  />
                )}
                {lockedCollections.length !== 0 && (
                  <LockedCollectionsList
                    lockedCollections={lockedCollections}
                    onUnlockClick={this.confirmUnlockOnUnlockClick}
                    seriesInstanceUid={seriesInstanceUid}
                  />
                )}
              </tbody>
            </table>
          </div>

          <RoiContourSettings />
        </div>
      );
    }

    return <React.Fragment>{component}</React.Fragment>;
  }
}
