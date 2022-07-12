import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import { toolDescriptors, dataExchange } from './lib';
import { getImageAttributes } from './utils';
import LIST from './ListCriteria';
import XNAT_EVENTS from './XNATEvents';
import getAnatomyCoding from '../utils/getAnatomyCoding';
import assignViewportParameters from '../utils/assignViewportParameters';

const triggerEvent = csTools.importInternal('util/triggerEvent');

const defaultConfig = {
  displayCriteria: {
    // filtering criteria
    filter: LIST.FILTER.CURRENT_SCAN,
    // grouping criteria
    // sorting criteria
  },
};

class XNATMeasurementApi {
  constructor() {
    this._config = Object.assign({}, defaultConfig);
    this.init();
  }

  init() {
    const toolDescriptorList = [];
    const measurementsCollection = {};
    Object.keys(toolDescriptors).forEach(key => {
      const toolDescriptor = toolDescriptors[key];
      toolDescriptorList.push(toolDescriptor);
      measurementsCollection[toolDescriptor.id] = [];
    });
    this._toolDescriptorList = toolDescriptorList;
    this._measurements = [];
    this._measurementUuids = [];
    // Grouped by tool type
    this._measurementsCollection = measurementsCollection;
  }

  getToolDescriptor(toolType) {
    return this._toolDescriptorList.find(
      descriptor => descriptor.cornerstoneToolType === toolType
    );
  }

  get config() {
    return Object.assign({}, this._config);
  }

  get measurements() {
    return this._measurements;
  }

  addMeasurement(params) {
    const { element, measurementData, toolType, descriptor } = params;

    const collection = this._measurementsCollection[toolType];
    if (!collection) return;

    if (!measurementData || measurementData.cancelled) return;

    const imageAttributes = getImageAttributes(element);
    const viewport = {};
    const currentViewport = cornerstone.getViewport(element);
    assignViewportParameters(viewport, currentViewport);
    const metadata = {
      label: 'Unnamed measurement',
      codingSequence: [
        getAnatomyCoding({
          categoryUID: 'T-D0050',
          typeUID: 'T-D0050',
          // modifierUID: undefined,
        }),
      ],
      description: '',
      displayFunction: descriptor.options.displayFunction,
      // userId: ToDo add user ID from the XNAT session,
      toolType,
      viewport,
      icon: descriptor.icon,
    };

    measurementData.xnatMetadata = Object.assign({}, imageAttributes, metadata);
    measurementData.descriptor = descriptor;
    measurementData.toolType = toolType;

    descriptor.options.updateMetadata(measurementData);

    this._measurements.push(measurementData);
    this._measurementUuids.push(measurementData.uuid);

    return true;
  }

  modifyMeasurement(params) {
    const { measurementData, toolType, descriptor } = params;

    const collection = this._measurementsCollection[toolType];
    if (!collection) return;

    descriptor.options.updateMetadata(measurementData);

    return true;
  }

  removeMeasurement(params) {
    const { measurementData, toolType } = params;
    const uuid = measurementData.uuid;

    const collection = this._measurementsCollection[toolType];
    if (!collection) return;

    let index = this._measurementUuids.indexOf(uuid);
    if (index > -1) {
      this._measurementUuids.splice(index, 1);
      this._measurements.splice(index, 1);
    }

    return true;
  }

  onMeasurementCompleted(event) {
    const eventData = _getEventData(event);
    const { element, measurementData, toolType } = eventData;

    if (!this.getToolDescriptor) return;
    const descriptor = this.getToolDescriptor(toolType);
    if (!descriptor) return;

    if (
      this.addMeasurement({ element, measurementData, toolType, descriptor })
    ) {
      triggerEvent(element, XNAT_EVENTS.MEASUREMENT_COMPLETED, {});
      // refreshCornerstoneViewports();
      // TODO: Notify about the last activated measurement
      // if (MeasurementApi.isToolIncluded(tool)) {
      //     // TODO: Notify that viewer suffered changes
      //   }
    }
  }

  onMeasurementModified(event) {
    const eventData = _getEventData(event);
    const { element, measurementData, toolType } = eventData;

    if (!this.getToolDescriptor) return;
    const descriptor = this.getToolDescriptor(toolType);
    if (!descriptor) return;

    if (this.modifyMeasurement({ measurementData, toolType, descriptor })) {
      triggerEvent(element, XNAT_EVENTS.MEASUREMENT_MODIFIED, {});
      // TODO: Notify about the last activated measurement
      // if (MeasurementApi.isToolIncluded(tool)) {
      //     // TODO: Notify that viewer suffered changes
      //   }
    }
  }

  onMeasurementRemoved(event) {
    const eventData = _getEventData(event);
    const { element, measurementData, toolType } = eventData;

    if (!this.getToolDescriptor) return;
    const descriptor = this.getToolDescriptor(toolType);
    if (!descriptor) return;

    if (this.removeMeasurement({ measurementData, toolType })) {
      triggerEvent(element, XNAT_EVENTS.MEASUREMENT_REMOVED, {});
      // refreshCornerstoneViewports();
      // TODO: Notify about the last activated measurement
      // if (MeasurementApi.isToolIncluded(tool)) {
      //     // TODO: Notify that viewer suffered changes
      //   }
    }
  }

  /**
   *
   * @param options
   * @return {*[]} measurement arranged in collections based on display criteria
   */
  getMeasurementCollections(options = {}) {
    let displayCriteria;
    if (options.displayCriteria) {
      displayCriteria = Object.assign(
        this._config.displayCriteria,
        options.displayCriteria
      );
      this._config.displayCriteria = displayCriteria;
    } else {
      displayCriteria = this._config.displayCriteria;
    }

    const measurements = this._measurements;

    // Apply filtering criteria
    let filteredCollection = [];
    switch (displayCriteria.filter) {
      case LIST.FILTER.CURRENT_SCAN:
        filteredCollection = _filterMeasurements(
          measurements,
          'SeriesInstanceUID',
          options.SeriesInstanceUID
        );
        break;
      case LIST.FILTER.CURRENT_SESSION:
        break;
      case LIST.FILTER.ALL:
        break;
    }

    const collections = [];
    collections.push(filteredCollection);

    return collections;
  }
}

const _filterMeasurements = (list, prop, value) => {
  return list.filter(item => item.xnatMetadata[prop] === value);
};

const _getUuidList = list => {
  return list.map(item => item.uuid);
};

const _getEventData = event => {
  const eventData = event.detail;
  if (eventData.toolName) {
    eventData.toolType = eventData.toolName;
  }

  return eventData;
};

const xnatMeasurementApi = new XNATMeasurementApi();

export default xnatMeasurementApi;
