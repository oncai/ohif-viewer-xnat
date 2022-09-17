import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import { ImageMeasurementCollection, imageMeasurements } from './lib';
import {
  getImageAttributes,
  getImportedImageId,
  getSeriesAttributes,
  assignViewportParameters,
  refreshToolStateManager,
} from '../utils';
import XNAT_EVENTS from './XNATEvents';

const triggerEvent = csTools.importInternal('util/triggerEvent');
const globalToolStateManager = csTools.globalImageIdSpecificToolStateManager;

class XNATMeasurementApi {
  constructor() {
    this.init();
  }

  init() {
    const supportedToolTypes = [];
    const supportedGenericToolTypes = {};
    Object.keys(imageMeasurements).forEach(key => {
      const measurement = imageMeasurements[key];
      supportedToolTypes.push(measurement.toolType);
      supportedGenericToolTypes[measurement.genericToolType] = measurement;
    });
    this._supportedToolTypes = supportedToolTypes;
    this._supportedGenericToolTypes = supportedGenericToolTypes;
    this._seriesCollections = new Map();
  }

  isToolSupported(toolType) {
    return this._supportedToolTypes.includes(toolType);
  }

  getMeasurementCollections(displaySetInstanceUID) {
    let seriesCollection = this._seriesCollections.get(displaySetInstanceUID);
    if (!seriesCollection) {
      const paras = getSeriesAttributes(displaySetInstanceUID);
      seriesCollection = {
        workingCollection: new ImageMeasurementCollection({ paras }),
        importedCollections: [],
      };
      this._seriesCollections.set(displaySetInstanceUID, seriesCollection);
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

    const {
      activeViewportIndex,
      viewportSpecificData,
    } = window.store.getState().viewports;
    const { displaySetInstanceUID } = viewportSpecificData[activeViewportIndex];

    const seriesCollection = this.getMeasurementCollections(
      displaySetInstanceUID
    );
    const collection = seriesCollection.workingCollection;
    const { uuid: collectionUID } = collection.metadata;
    const { StudyInstanceUID, SeriesInstanceUID } = collection.imageReference;

    const MeasurementTool = imageMeasurements[toolType];
    const measurement = new MeasurementTool(false, {
      collectionUID,
      measurementData,
      imageAttributes: {
        ...imageAttributes,
        StudyInstanceUID,
        SeriesInstanceUID,
        displaySetInstanceUID,
      },
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
    const {
      uuid,
      toolType,
      imageId,
      displaySetInstanceUID,
    } = measurementReference;

    const seriesCollection = this.getMeasurementCollections(
      displaySetInstanceUID
    );
    const collection = seriesCollection.workingCollection;

    if (removeToolState) {
      const toolState = globalToolStateManager.saveToolState();
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

  addImportedCollection(displaySetInstanceUID, collectionObject) {
    const seriesCollection = this.getMeasurementCollections(
      displaySetInstanceUID
    );
    const { importedCollections } = seriesCollection;
    const { imageMeasurements: measurementObjects } = collectionObject;

    const lockedCollection = new ImageMeasurementCollection({
      paras: {
        collectionObject,
        displaySetInstanceUID,
      },
      imported: true,
    });

    importedCollections.push(lockedCollection);

    const { uuid: collectionUID } = lockedCollection.metadata;
    const {
      StudyInstanceUID,
      SeriesInstanceUID,
    } = lockedCollection.imageReference;

    const toolTypes = [];
    measurementObjects.forEach(measurementObject => {
      const { toolType, imageReference, data } = measurementObject;
      const MeasurementTool = this._supportedGenericToolTypes[toolType];
      if (MeasurementTool) {
        const { SOPInstanceUID, frameIndex } = imageReference;
        const imageId = getImportedImageId(
          displaySetInstanceUID,
          SOPInstanceUID
        );
        const measurement = new MeasurementTool(true, {
          collectionUID,
          measurementObject,
          // measurementData,
          imageAttributes: {
            SOPInstanceUID,
            frameIndex,
            imageId,
            StudyInstanceUID,
            SeriesInstanceUID,
            displaySetInstanceUID,
          },
        });
        measurement.populateCSMeasurementData(data);

        // Add measurement to toolstate
        globalToolStateManager.addImageIdToolState(
          imageId,
          MeasurementTool.toolType,
          measurement.csData
        );

        toolTypes.push(MeasurementTool.toolType);

        lockedCollection.addMeasurement(measurement);
      }
    });

    refreshToolStateManager([...new Set(toolTypes)]);
  }

  removeImportedCollection(collectionUuid, displaySetInstanceUID) {
    const seriesCollection = this.getMeasurementCollections(
      displaySetInstanceUID
    );
    const collection = seriesCollection.importedCollections.find(
      collectionI => collectionI.metadata.uuid === collectionUuid
    );

    // Remove toolstate
    const toolState = globalToolStateManager.saveToolState();
    collection.measurements.forEach(measurement => {
      const {
        uuid,
        toolType,
        imageId,
      } = measurement.csData.measurementReference;
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
    });

    const index = seriesCollection.importedCollections.indexOf(
      collectionI => collectionI.metadata.uuid === collectionUuid
    );

    seriesCollection.importedCollections.splice(index, 1);
  }

  lockExportedCollection(
    seriesCollection,
    collectionObject,
    selectedMeasurements
  ) {
    const { workingCollection, importedCollections } = seriesCollection;
    const displaySetInstanceUID =
      workingCollection.internal.displaySetInstanceUID;
    const lockedCollection = new ImageMeasurementCollection({
      paras: {
        collectionObject,
        displaySetInstanceUID,
      },
      imported: true,
    });
    importedCollections.push(lockedCollection);
    selectedMeasurements.forEach(measurement => {
      const { uuid } = measurement.metadata;
      lockedCollection.addMeasurement(measurement);
      workingCollection.removeMeasurement(uuid);
    });

    workingCollection.resetMetadata();
  }
}

const xnatMeasurementApi = new XNATMeasurementApi();

export default xnatMeasurementApi;
