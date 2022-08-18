import React from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import MenuIOButtons from './common/MenuIOButtons.js';
import onIOCancel from './common/helpers/onIOCancel';
import { Icon } from '@ohif/ui';
import {
  xnatMeasurementApi,
  MeasurementWorkingCollection,
  MeasurementExportMenu,
  MeasurementImportMenu,
  XNAT_EVENTS,
  assignViewportParameters,
} from '../XNATMeasurement';
import refreshViewports from '../utils/refreshViewports';

import './XNATRoiPanel.styl';

export default class XNATMeasurementPanel extends React.Component {
  static propTypes = {
    isOpen: PropTypes.any,
    studies: PropTypes.any,
    viewports: PropTypes.any,
    activeIndex: PropTypes.any,
    onJumpToItem: PropTypes.func.isRequired,
  };

  static defaultProps = {
    isOpen: undefined,
    studies: undefined,
    viewports: undefined,
    activeIndex: undefined,
  };

  constructor(props = {}) {
    super(props);

    const { viewports, activeIndex } = props;

    const displaySetInstanceUID = viewports[activeIndex].displaySetInstanceUID;

    const collections = xnatMeasurementApi.getMeasurementCollections({
      displaySetInstanceUID,
    });

    this.state = {
      importing: false,
      exporting: false,
      showSettings: false,
      displaySetInstanceUID,
      collections,
      selectedKey: '',
    };

    this.onIOComplete = this.onIOComplete.bind(this);
    this.onIOCancel = onIOCancel.bind(this);
    this.cornerstoneEventListenerHandler = this.cornerstoneEventListenerHandler.bind(
      this
    );
    this.addEventListeners = this.addEventListeners.bind(this);
    this.removeEventListeners = this.removeEventListeners.bind(this);
    this.onItemRemove = this.onItemRemove.bind(this);
    this.onJumpToItem = this.onJumpToItem.bind(this);
    this.onResetViewport = this.onResetViewport.bind(this);

    this.addEventListeners();
  }

  componentDidUpdate(prevProps) {
    const { viewports, activeIndex } = this.props;
    const { displaySetInstanceUID } = this.state;

    if (
      viewports[activeIndex] &&
      viewports[activeIndex].displaySetInstanceUID !== displaySetInstanceUID
    ) {
      this.refreshMeasurementList();
    }
  }

  componentWillUnmount() {
    this.removeEventListeners();
  }

  addEventListeners() {
    this.removeEventListeners();

    csTools.store.state.enabledElements.forEach(enabledElement => {
      // enabledElement.addEventListener(
      //   XNAT_EVENTS.MEASUREMENT_ADDED,
      //   this.cornerstoneEventListenerHandler
      // );
      enabledElement.addEventListener(
        XNAT_EVENTS.MEASUREMENT_REMOVED,
        this.cornerstoneEventListenerHandler
      );
      enabledElement.addEventListener(
        XNAT_EVENTS.MEASUREMENT_MODIFIED,
        this.cornerstoneEventListenerHandler
      );
      enabledElement.addEventListener(
        XNAT_EVENTS.MEASUREMENT_COMPLETED,
        this.cornerstoneEventListenerHandler
      );
    });
  }

  removeEventListeners() {
    csTools.store.state.enabledElements.forEach(enabledElement => {
      // enabledElement.removeEventListener(
      //   XNAT_EVENTS.MEASUREMENT_ADDED,
      //   this.cornerstoneEventListenerHandler
      // );
      enabledElement.removeEventListener(
        XNAT_EVENTS.MEASUREMENT_REMOVED,
        this.cornerstoneEventListenerHandler
      );
      enabledElement.removeEventListener(
        XNAT_EVENTS.MEASUREMENT_MODIFIED,
        this.cornerstoneEventListenerHandler
      );
      enabledElement.removeEventListener(
        XNAT_EVENTS.MEASUREMENT_COMPLETED,
        this.cornerstoneEventListenerHandler
      );
    });
  }

  cornerstoneEventListenerHandler() {
    this.refreshMeasurementList();
  }

  refreshMeasurementList() {
    const { viewports, activeIndex } = this.props;
    if (viewports[activeIndex]) {
      const {
        displaySetInstanceUID,
        SeriesInstanceUID,
        StudyInstanceUID,
      } = viewports[activeIndex];
      const collections = xnatMeasurementApi.getMeasurementCollections({
        displaySetInstanceUID,
        SeriesInstanceUID,
        StudyInstanceUID,
      });
      this.setState({ displaySetInstanceUID, collections: collections });
    }
  }

  onJumpToItem(measurement) {
    const { viewports, activeIndex, onJumpToItem } = this.props;

    const enabledElements = cornerstone.getEnabledElements();
    const element = enabledElements[activeIndex].element;
    const toolState = csTools.getToolState(element, 'stack');

    if (!toolState) {
      return;
    }

    const { imageId, viewport: itemViewport } = measurement.xnatMetadata;

    const imageIds = toolState.data[0].imageIds;
    const frameIndex = imageIds.indexOf(imageId);
    const SOPInstanceUID = cornerstone.metaData.get('SOPInstanceUID', imageId);
    const StudyInstanceUID = cornerstone.metaData.get(
      'StudyInstanceUID',
      imageId
    );

    const switchViewport = true;
    if (switchViewport) {
      const viewport = cornerstone.getViewport(element);
      assignViewportParameters(viewport, itemViewport);
      cornerstone.setViewport(element, viewport);
    }

    onJumpToItem({
      StudyInstanceUID,
      SOPInstanceUID,
      frameIndex,
      activeViewportIndex: activeIndex,
      displaySetInstanceUID: viewports[activeIndex].displaySetInstanceUID,
      windowingType: 'Manual',
    });
  }

  onResetViewport(measurement) {
    const { viewports, activeIndex } = this.props;

    const enabledElements = cornerstone.getEnabledElements();
    const element = enabledElements[activeIndex].element;
    const toolState = csTools.getToolState(element, 'stack');

    const { viewport: itemViewport } = measurement.xnatMetadata;
    const viewport = cornerstone.getViewport(element);
    assignViewportParameters(itemViewport, viewport);
  }

  onItemRemove(measurementReference) {
    xnatMeasurementApi.removeMeasurement(measurementReference, true);
    refreshViewports();
    this.refreshMeasurementList();
  }

  onIOComplete() {}

  render() {
    const {
      importing,
      exporting,
      showSettings,
      displaySetInstanceUID,
      collections,
      selectedKey,
    } = this.state;

    const { viewports, activeIndex } = this.props;

    let component;

    if (showSettings) {
      component = <div>Measurement Settings</div>;
    } else if (importing) {
      component = <div>Measurement Importing</div>;
    } else if (exporting) {
      component = (
        <MeasurementExportMenu
          onExportComplete={this.onIOComplete}
          onExportCancel={this.onIOCancel}
          workingCollection={collections.workingCollection}
        />
      );
    } else {
      component = (
        <div
          className="xnatPanel"
          onClick={() => this.setState({ selectedKey: '' })}
        >
          <div className="panelHeader">
            <div className="title-with-icon">
              <h3>Measurement Annotations</h3>
              <Icon
                className="settings-icon"
                name="cog"
                width="20px"
                height="20px"
                onClick={() => this.setState({ showSettings: true })}
                title="Measurement Settings"
              />
            </div>
            <MenuIOButtons
              ImportCallbackOrComponent={MeasurementImportMenu}
              ExportCallbackOrComponent={MeasurementExportMenu}
              onImportButtonClick={() => this.setState({ importing: true })}
              onExportButtonClick={() => this.setState({ exporting: true })}
            />
          </div>

          <div className="roiCollectionBody">
            <div className="workingCollectionHeader">
              <h4> In-Progress Measurement Collection </h4>
            </div>

            <MeasurementWorkingCollection
              collection={collections.workingCollection}
              selectedKey={selectedKey}
              onItemRemove={this.onItemRemove}
              onJumpToItem={this.onJumpToItem}
              onResetViewport={this.onResetViewport}
            />
          </div>
        </div>
      );
    }

    return <React.Fragment>{component}</React.Fragment>;
  }
}
