import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import { ImageMeasurementCollection, imageMeasurements } from './lib';
import { getImageAttributes, assignViewportParameters } from '../utils';
import XNAT_EVENTS from './XNATEvents';

const triggerEvent = csTools.importInternal('util/triggerEvent');

class XNATMeasurementApi {
  constructor() {
    this.init();
  }

  init() {
    const supportedToolTypes = [];
    Object.keys(imageMeasurements).forEach(key => {
      const tool = imageMeasurements[key];
      supportedToolTypes.push(tool.toolType);
    });
    this._supportedToolTypes = supportedToolTypes;
    this._seriesCollections = new Map();
  }

  isToolSupported(toolType) {
    return this._supportedToolTypes.includes(toolType);
  }

  getMeasurementCollections(paras) {
    let seriesCollection = this._seriesCollections.get(
      paras.displaySetInstanceUID
    );
    if (!seriesCollection) {
      seriesCollection = {
        workingCollection: new ImageMeasurementCollection({ paras }),
        importedCollections: [],
      };
      this._seriesCollections.set(
        paras.displaySetInstanceUID,
        seriesCollection
      );
    }

    return seriesCollection;
  }

  onMeasurementCompleted(event) {
    const eventData = event.detail;
    const { element, measurementData, toolName: toolType } = eventData;

    if (!this.isToolSupported || !this.isToolSupported(toolType)) {
      return;
    }

    if (!measurementData || measurementData.cancelled) return;

    // set tool color
    const color = measurementData.color;
    measurementData.color = color ? color : csTools.toolColors.getToolColor();

    if (this.addMeasurement({ element, measurementData, toolType })) {
      triggerEvent(element, XNAT_EVENTS.MEASUREMENT_COMPLETED, {});
      // TODO: Notify about the last activated measurement
    }
  }

  addMeasurement(params) {
    const { element, measurementData, toolType } = params;

    const currentViewport = cornerstone.getViewport(element);
    const imageAttributes = getImageAttributes(element);

    const seriesCollection = this.getMeasurementCollections(imageAttributes);
    const collection = seriesCollection.workingCollection;
    const { uuid: collectionUID } = collection.metadata;

    const MeasurementTool = imageMeasurements[toolType];
    const measurement = new MeasurementTool(false, {
      collectionUID,
      measurementData,
      imageAttributes,
      viewport: assignViewportParameters({}, currentViewport),
    });

    collection.addMeasurement(measurement);

    return true;
  }

  onMeasurementModified(event) {
    const eventData = event.detail;
    const { element, measurementData, toolName: toolType } = eventData;
    const { measurementReference } = measurementData;

    if (
      !this.isToolSupported ||
      !this.isToolSupported(toolType) ||
      !measurementReference
    ) {
      return;
    }

    triggerEvent(element, XNAT_EVENTS.MEASUREMENT_MODIFIED, {});
    // TODO: Notify about the last activated measurement
  }

  onMeasurementRemoved(event) {
    const eventData = event.detail;
    const { element, measurementData, toolName: toolType } = eventData;
    const { measurementReference } = measurementData;

    if (
      !this.isToolSupported ||
      !this.isToolSupported(toolType) ||
      !measurementReference
    ) {
      return;
    }

    if (this.removeMeasurement(measurementReference)) {
      triggerEvent(element, XNAT_EVENTS.MEASUREMENT_REMOVED, {});
      // TODO: Notify about the last activated measurement
    }
  }

  removeMeasurement(measurementReference, removeToolState = false) {
    const { uuid, toolType, imageId } = measurementReference;

    const seriesCollection = this.getMeasurementCollections(
      measurementReference
    );
    const collection = seriesCollection.workingCollection;

    if (removeToolState) {
      const toolState = csTools.globalImageIdSpecificToolStateManager.saveToolState();
      if (imageId && toolState[imageId]) {
        const toolData = toolState[imageId][toolType];
        const measurementEntries = toolData && toolData.data;
        const measurementEntry = measurementEntries.find(
          item => item.uuid === uuid
        );
        if (measurementEntry) {
          const index = measurementEntries.indexOf(measurementEntry);
          measurementEntries.splice(index, 1);
        }
      }
    }

    collection.removeMeasurement(uuid);

    return true;
  }

  exportWorkingCollection(collectionReference) {
    const seriesCollection = this.getMeasurementCollections(
      collectionReference
    );
    const collection = seriesCollection.workingCollection;
  }
}

const xnatMeasurementApi = new XNATMeasurementApi();

export default xnatMeasurementApi;
