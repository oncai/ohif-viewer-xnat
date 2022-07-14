import React from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import OHIF from '@ohif/core';
import MenuIOButtons from './common/MenuIOButtons.js';
import onIOCancel from './common/helpers/onIOCancel';
import XNATMeasurementImportMenu from './XNATMeasurementImportMenu/XNATMeasurementImportMenu';
import XNATMeasurementExportMenu from './XNATMeasurementExportMenu/XNATMeasurementExportMenu';
import getSeriesInstanceUidFromViewport from '../utils/getSeriesInstanceUidFromViewport';
import { Icon } from '@ohif/ui';
import {
  xnatMeasurementApi,
  XNATMeasurementTable,
  XNAT_EVENTS,
  actionFunctions,
  assignViewportParameters,
} from '../XNATMeasurement';

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

    const SeriesInstanceUID = getSeriesInstanceUidFromViewport(
      viewports,
      activeIndex
    );

    const { displayCriteria } = xnatMeasurementApi.config;
    const collections = xnatMeasurementApi.getMeasurementCollections({
      SeriesInstanceUID,
    });

    this.state = {
      importing: false,
      exporting: false,
      showSettings: false,
      SeriesInstanceUID,
      displayCriteria,
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
    this.onItemClick = this.onItemClick.bind(this);
    this.onItemRemove = this.onItemRemove.bind(this);
    this.onJumpToItem = this.onJumpToItem.bind(this);
    this.onResetViewport = this.onResetViewport.bind(this);

    this.addEventListeners();
  }

  componentDidUpdate(prevProps) {
    const { viewports, activeIndex } = this.props;
    const { SeriesInstanceUID } = this.state;

    if (
      viewports[activeIndex] &&
      viewports[activeIndex].SeriesInstanceUID !== SeriesInstanceUID
    ) {
      this.refreshMeasurementList(
        viewports[activeIndex] && viewports[activeIndex].SeriesInstanceUID
      );
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
    this.refreshMeasurementList(this.state.SeriesInstanceUID);
  }

  refreshMeasurementList(SeriesInstanceUID) {
    const collections = xnatMeasurementApi.getMeasurementCollections({
      SeriesInstanceUID,
      displayCriteria: this.state.displayCriteria,
    });
    this.setState({ SeriesInstanceUID, collections: collections });
  }

  onItemClick(measurement) {
    this.setState({ selectedKey: measurement.uuid });
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

  onItemRemove(measurement) {
    actionFunctions.onRemoveSingleMeasurement(measurement);
    this.refreshMeasurementList(this.state.SeriesInstanceUID);
  }

  onIOComplete() {}

  render() {
    const {
      importing,
      exporting,
      showSettings,
      SeriesInstanceUID,
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
      component = <div>Measurement Exporting</div>;
    } else {
      component = (
        <div className="xnatPanel" onClick={() => this.setState({ selectedKey: undefined })}>
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
              ImportCallbackOrComponent={XNATMeasurementImportMenu}
              ExportCallbackOrComponent={XNATMeasurementExportMenu}
              onImportButtonClick={() => this.setState({ importing: true })}
              onExportButtonClick={() => this.setState({ exporting: true })}
            />
          </div>

          <div className="roiCollectionBody">
            <div className="workingCollectionHeader">
              <h4> Measurement Collection </h4>
            </div>

            <XNATMeasurementTable
              collection={collections[0]}
              selectedKey={selectedKey}
              onItemClick={this.onItemClick}
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

/**
 *  Takes a list of tools grouped and return all tools separately
 *
 * @param {Array} [toolGroups=[]] - The grouped tools
 * @returns {Array} - The list of all tools on all groups
function getAllTools(toolGroups = []) {
  let tools = [];
  toolGroups.forEach(toolGroup => (tools = tools.concat(toolGroup.childTools)));

  return tools;
}
*/
/**
 * Takes a list of objects and a property and return the list grouped by the property
 *
 * @param {Array} list - The objects to be grouped by
 * @param {string} props - The property to group the objects
 * @returns {Object}
function groupBy(list, props) {
  return list.reduce((a, b) => {
    (a[b[props]] = a[b[props]] || []).push(b);
    return a;
  }, {});
}
*/
/**
 * Take a measurement toolName and return if any warnings
 *
 * @param {string} toolName - The tool name
 * @returns {string}
function getWarningsForMeasurement(toolName) {
  const isToolSupported = true;

  return {
    hasWarnings: !isToolSupported,
    warningTitle: isToolSupported ? '' : 'Unsupported Tool',
    warningList: isToolSupported
      ? []
      : [`${toolName} cannot be persisted at this time`],
  };
}
*/
/**
 * Takes measurementData and build the measurement text to be used into the table
 *
 * @param {Object} [measurementData={}]
 * @param {string} measurementData.location - The measurement location
 * @param {string} measurementData.description - The measurement description
 * @returns {string}
function getMeasurementText(measurementData = {}) {
  const defaultText = '...';
  const { location = '', description = '' } = measurementData;
  const result = location + (description ? ` (${description})` : '');

  return result || defaultText;
}
*/

/**
 * Takes a list of measurements grouped by measurement numbers and return each measurement data by available timepoint
 *
 * @param {Array} measurementNumberList - The list of measurements
 * @param {Array} timepoints - The list of available timepoints
 * @param {Function} displayFunction - The function that builds the display text by each tool
 * @returns
function getDataForEachMeasurementNumber(
  measurementNumberList,
  timepoints,
  displayFunction
) {
  const data = [];
  // on each measurement number we should get each measurement data by available timepoint
  measurementNumberList.forEach(measurement => {
    timepoints.forEach(timepoint => {
      const eachData = {
        displayText: '...',
      };
      if (measurement.timepointId === timepoint.timepointId) {
        eachData.displayText = displayFunction(measurement);
      }
      data.push(eachData);
    });
  });

  return data;
}
*/

/**
 * Take measurements from MeasurementAPI structure and convert into a measurementTable structure
 *
 * @returns
function convertMeasurementsToTableData(SeriesInstanceUID) {
  const measurementApi = OHIF.measurements.MeasurementApi;
  const timepointApi = OHIF.measurements.TimepointApi;

  const toolCollections = measurementApi.Instance.tools;
  const timepoints = timepointApi.Instance.timepoints;

  const config = measurementApi.getConfiguration();
  const toolGroups = config.measurementTools;
  const tools = getAllTools(toolGroups);

  const tableMeasurements = toolGroups.map(toolGroup => {
    return {
      groupName: toolGroup.name,
      groupId: toolGroup.id,
      measurements: [],
    };
  });

  Object.keys(toolCollections).forEach(toolId => {
    const toolMeasurements = toolCollections[toolId];
    const tool = tools.find(tool => tool.id === toolId);
    const { displayFunction } = tool.options.measurementTable;

    // Group by measurementNumber so we can display then all in the same line
    const groupedMeasurements = groupBy(toolMeasurements, 'measurementNumber');

    Object.keys(groupedMeasurements).forEach(groupedMeasurementsIndex => {
      const measurementNumberList =
        groupedMeasurements[groupedMeasurementsIndex];
      const measurementData = measurementNumberList[0];
      const {
        measurementNumber,
        lesionNamingNumber,
        toolType,
      } = measurementData;
      const measurementId = measurementData._id;

      const {
        hasWarnings,
        warningTitle,
        warningList,
      } = getWarningsForMeasurement(toolType);

      //check if all measurements with same measurementNumber will have same LABEL
      const tableMeasurement = {
        itemNumber: lesionNamingNumber,
        label: getMeasurementText(measurementData),
        measurementId,
        measurementNumber,
        lesionNamingNumber,
        toolType,
        hasWarnings,
        warningTitle,
        warningList,
        isSplitLesion: false, //TODO
        data: getDataForEachMeasurementNumber(
          measurementNumberList,
          timepoints,
          displayFunction
        ),
      };

      // find the group object for the tool
      const toolGroupMeasurements = tableMeasurements.find(group => {
        return group.groupId === tool.toolGroup;
      });
      // inject the new measurement for this measurementNumer
      toolGroupMeasurements.measurements.push(tableMeasurement);
    });
  });

  // Sort measurements by lesion naming number
  tableMeasurements.forEach(tm => {
    tm.measurements.sort((m1, m2) =>
      m1.lesionNamingNumber > m2.lesionNamingNumber ? 1 : -1
    );
  });

  return tableMeasurements;
}
*/
