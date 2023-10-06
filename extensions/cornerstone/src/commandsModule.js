import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import OHIF from '@ohif/core';

import contextMenuHandler from './utils/contextMenuHandler';

import setCornerstoneLayout from './utils/setCornerstoneLayout.js';
import {
  getEnabledElement,
  getActiveViewportIndex,
  setWindowing,
  getWindowing,
} from './state';
import CornerstoneViewportDownloadForm from './CornerstoneViewportDownloadForm';
import {
  referenceLines,
  XNATToolStrategiesDialog,
  XNAT_TOOL_NAMES,
} from '@xnat-ohif/extension-xnat';
import resetViewport from './utils/resetViewport';

const scroll = cornerstoneTools.import('util/scroll');

const { studyMetadataManager } = OHIF.utils;
const { setViewportSpecificData } = OHIF.redux.actions;

const refreshCornerstoneViewports = () => {
  cornerstone.getEnabledElements().forEach(enabledElement => {
    if (enabledElement.image) {
      cornerstone.updateImage(enabledElement.element);
    }
  });
};

const showXNATToolStrategies = options => {
  const { toolStrategies, tool, servicesManager } = options;
  const { UIDialogService } = servicesManager.services;
  const DIALOG_ID = 'XNAT_TOOL_STRATEGIES_DIALOG_ID';

  if (!UIDialogService) {
    return;
  }

  // UIDialogService.dismiss({ id: DIALOG_ID });
  const { x, y } = document
    .querySelector(`.ViewerMain`)
    .getBoundingClientRect();
  UIDialogService.create({
    id: DIALOG_ID,
    content: XNATToolStrategiesDialog,
    contentProps: {
      toolStrategies,
      tool,
      onClose: UIDialogService.dismiss({ id: DIALOG_ID }),
    },
    defaultPosition: {
      x: x + 20 || 0,
      y: y + 100 || 0,
    },
  });
};

const commandsModule = ({ servicesManager }) => {
  const actions = {
    rotateViewport: ({ viewports, rotation }) => {
      const enabledElement = getEnabledElement(viewports.activeViewportIndex);

      if (enabledElement) {
        let viewport = cornerstone.getViewport(enabledElement);
        viewport.rotation += rotation;
        cornerstone.setViewport(enabledElement, viewport);
      }
    },
    flipViewportHorizontal: ({ viewports }) => {
      const enabledElement = getEnabledElement(viewports.activeViewportIndex);

      if (enabledElement) {
        let viewport = cornerstone.getViewport(enabledElement);
        viewport.hflip = !viewport.hflip;
        cornerstone.setViewport(enabledElement, viewport);
      }
    },
    flipViewportVertical: ({ viewports }) => {
      const enabledElement = getEnabledElement(viewports.activeViewportIndex);

      if (enabledElement) {
        let viewport = cornerstone.getViewport(enabledElement);
        viewport.vflip = !viewport.vflip;
        cornerstone.setViewport(enabledElement, viewport);
      }
    },
    scaleViewport: ({ direction, viewports }) => {
      const enabledElement = getEnabledElement(viewports.activeViewportIndex);
      const step = direction * 0.15;

      if (enabledElement) {
        if (step) {
          let viewport = cornerstone.getViewport(enabledElement);
          viewport.scale += step;
          cornerstone.setViewport(enabledElement, viewport);
        } else {
          cornerstone.fitToWindow(enabledElement);
        }
      }
    },
    resetViewport: ({ viewports }) => {
      const element = getEnabledElement(viewports.activeViewportIndex);

      if (element) {
        const enabledElement = cornerstone.getEnabledElement(element);
        const pixelReplication = enabledElement.viewport.pixelReplication;
        setWindowing(enabledElement.uuid, 'Default');
        resetViewport(enabledElement);
        if (pixelReplication) {
          const updatedEnabledElement = cornerstone.getEnabledElement(element);
          updatedEnabledElement.viewport.pixelReplication = pixelReplication;
          cornerstone.updateImage(element);
        }
      }
    },
    invertViewport: ({ viewports }) => {
      const enabledElement = getEnabledElement(viewports.activeViewportIndex);

      if (enabledElement) {
        let viewport = cornerstone.getViewport(enabledElement);
        viewport.invert = !viewport.invert;
        cornerstone.setViewport(enabledElement, viewport);
      }
    },
    // TODO: this is receiving `evt` from `ToolbarRow`. We could use it to have
    //       better mouseButtonMask sets.
    setToolActive: options => {
      const { toolName, evt, toolStrategies, ...rest } = options;
      const toolOptions = {
        ...rest,
        mouseButtonMask: 1,
      };
      if (!toolName) {
        console.warn('No toolname provided to setToolActive command');
      }
      // Set tool active globally
      cornerstoneTools.setToolActive(toolName, toolOptions);
      cornerstone.getEnabledElements().forEach(enabledElement => {
        if (enabledElement.image) {
          let showAnnotations = true;
          const viewport = enabledElement.viewport;
          if (viewport) {
            showAnnotations = viewport.hasOwnProperty('showAnnotations')
              ? viewport.showAnnotations
              : true;
          }

          // Disable tool locally for an element, if applicable
          if (
            !showAnnotations &&
            XNAT_TOOL_NAMES.ALL_ANNOTAION_TOOL_NAMES.includes(toolName)
          ) {
            cornerstoneTools.setToolDisabledForElement(
              enabledElement.element,
              toolName
            );
            cornerstoneTools.setInactiveCursor(enabledElement.element);
          }
        }
      });

      /*
      if (toolStrategies && toolStrategies.length) {
        const element = getEnabledElement(0);
        const tool = cornerstoneTools.getToolForElement(element, toolName);
        showXNATToolStrategies({
          toolStrategies,
          tool,
          servicesManager: servicesManager,
        });
      } else {
        const { UIDialogService } = servicesManager.services;
        UIDialogService.dismiss({ id: 'XNAT_TOOL_STRATEGIES_DIALOG_ID' });
      }
      */
    },
    clearAnnotations: ({ viewports }) => {
      const element = getEnabledElement(viewports.activeViewportIndex);
      if (!element) {
        return;
      }

      const enabledElement = cornerstone.getEnabledElement(element);
      if (!enabledElement || !enabledElement.image) {
        return;
      }

      const {
        toolState,
      } = cornerstoneTools.globalImageIdSpecificToolStateManager;
      if (
        !toolState ||
        toolState.hasOwnProperty(enabledElement.image.imageId) === false
      ) {
        return;
      }

      // --> Skip Measurements Service
      const imageToolState = toolState[enabledElement.image.imageId];
      Object.keys(imageToolState).forEach(key => {
        // Do not delete contours
        if (key !== 'FreehandRoi3DTool') {
          delete imageToolState[key];
        }
      });
      refreshCornerstoneViewports();
      // <-- Skip Measurements Service
      /*
      const imageIdToolState = toolState[enabledElement.image.imageId];

      const measurementsToRemove = [];

      Object.keys(imageIdToolState).forEach(toolType => {
        const { data } = imageIdToolState[toolType];

        data.forEach(measurementData => {
          const {
            _id,
            lesionNamingNumber,
            measurementNumber,
          } = measurementData;
          if (!_id) {
            return;
          }

          measurementsToRemove.push({
            toolType,
            _id,
            lesionNamingNumber,
            measurementNumber,
          });
        });
      });

      measurementsToRemove.forEach(measurementData => {
        OHIF.measurements.MeasurementHandlers.onRemoved({
          detail: {
            toolType: measurementData.toolType,
            measurementData,
          },
        });
      });
      */
    },
    nextImage: ({ viewports }) => {
      const enabledElement = getEnabledElement(viewports.activeViewportIndex);
      scroll(enabledElement, 1);
    },
    previousImage: ({ viewports }) => {
      const enabledElement = getEnabledElement(viewports.activeViewportIndex);
      scroll(enabledElement, -1);
    },
    getActiveViewportEnabledElement: ({ viewports }) => {
      const enabledElement = getEnabledElement(viewports.activeViewportIndex);
      return enabledElement;
    },
    showDownloadViewportModal: ({ title, viewports }) => {
      const activeViewportIndex = viewports.activeViewportIndex;
      const { UIModalService } = servicesManager.services;
      if (UIModalService) {
        UIModalService.show({
          content: CornerstoneViewportDownloadForm,
          title,
          contentProps: {
            activeViewportIndex,
            onClose: UIModalService.hide,
          },
        });
      }
    },
    updateTableWithNewMeasurementData({
      toolType,
      measurementNumber,
      location,
      description,
    }) {
      // Update all measurements by measurement number
      const measurementApi = OHIF.measurements.MeasurementApi.Instance;
      const measurements = measurementApi.tools[toolType].filter(
        m => m.measurementNumber === measurementNumber
      );

      measurements.forEach(measurement => {
        measurement.location = location;
        measurement.description = description;

        measurementApi.updateMeasurement(measurement.toolType, measurement);
      });

      measurementApi.syncMeasurementsAndToolData();

      refreshCornerstoneViewports();
    },
    getNearbyToolData({ element, canvasCoordinates, availableToolTypes }) {
      const nearbyTool = {};
      let pointNearTool = false;

      availableToolTypes.forEach(toolType => {
        const elementToolData = cornerstoneTools.getToolState(
          element,
          toolType
        );

        if (!elementToolData) {
          return;
        }

        elementToolData.data.forEach((toolData, index) => {
          let elementToolInstance = cornerstoneTools.getToolForElement(
            element,
            toolType
          );

          if (!elementToolInstance) {
            elementToolInstance = cornerstoneTools.getToolForElement(
              element,
              `${toolType}Tool`
            );
          }

          if (!elementToolInstance) {
            console.warn('Tool not found.');
            return undefined;
          }

          if (
            elementToolInstance.pointNearTool(
              element,
              toolData,
              canvasCoordinates
            )
          ) {
            pointNearTool = true;
            nearbyTool.tool = toolData;
            nearbyTool.index = index;
            nearbyTool.toolType = toolType;
          }
        });

        if (pointNearTool) {
          return false;
        }
      });

      return pointNearTool ? nearbyTool : undefined;
    },
    removeToolState: ({ element, toolType, tool }) => {
      cornerstoneTools.removeToolState(element, toolType, tool);
      cornerstone.updateImage(element);
    },
    setCornerstoneLayout: () => {
      setCornerstoneLayout();
    },
    setWindowLevel: ({ viewports, window, level, description }) => {
      const element = getEnabledElement(viewports.activeViewportIndex);

      if (element) {
        const enabledElement = cornerstone.getEnabledElement(element);
        setWindowing(enabledElement.uuid, `Preset / ${description}`);

        let viewport = cornerstone.getViewport(element);

        viewport.voi = {
          windowWidth: Number(window),
          windowCenter: Number(level),
        };
        cornerstone.setViewport(element, viewport);
      }
    },
    jumpToImage: ({
      StudyInstanceUID,
      SOPInstanceUID,
      frameIndex,
      activeViewportIndex,
      refreshViewports = true,
      displaySetInstanceUID,
      windowingType,
    }) => {
      const studies = studyMetadataManager.all();
      const study = studies.find(
        study =>
          study.getStudyInstanceUID() === StudyInstanceUID &&
          study.displaySets.some(
            ds => ds.displaySetInstanceUID === displaySetInstanceUID
          )
      );

      const displaySet = study.findDisplaySet(ds => {
        return (
          ds.displaySetInstanceUID === displaySetInstanceUID &&
          ds.images &&
          ds.images.find(i => i.getSOPInstanceUID() === SOPInstanceUID)
        );
      });

      if (!displaySet) {
        return;
      }

      if (windowingType) {
        const element = getEnabledElement(activeViewportIndex);
        const enabledElement = cornerstone.getEnabledElement(element);
        setWindowing(enabledElement.uuid, windowingType);
      }

      displaySet.SOPInstanceUID = SOPInstanceUID;
      displaySet.frameIndex = frameIndex;

      window.store.dispatch(
        setViewportSpecificData(activeViewportIndex, displaySet)
      );

      if (refreshViewports) {
        refreshCornerstoneViewports();
      }
    },
    subscribeToContextMenuHandler: ({
      tools,
      contextMenuCallback,
      dialogIds,
    }) => {
      contextMenuHandler.subscribe(tools, contextMenuCallback, dialogIds);
    },
    cancelTask: () => {
      contextMenuHandler.dismiss();
    },
  };

  const definitions = {
    jumpToImage: {
      commandFn: actions.jumpToImage,
      storeContexts: [],
      options: {},
    },
    getNearbyToolData: {
      commandFn: actions.getNearbyToolData,
      storeContexts: [],
      options: {},
    },
    removeToolState: {
      commandFn: actions.removeToolState,
      storeContexts: [],
      options: {},
    },
    updateTableWithNewMeasurementData: {
      commandFn: actions.updateTableWithNewMeasurementData,
      storeContexts: [],
      options: {},
    },
    showDownloadViewportModal: {
      commandFn: actions.showDownloadViewportModal,
      storeContexts: ['viewports'],
      options: {},
    },
    getActiveViewportEnabledElement: {
      commandFn: actions.getActiveViewportEnabledElement,
      storeContexts: ['viewports'],
      options: {},
    },
    rotateViewportCW: {
      commandFn: actions.rotateViewport,
      storeContexts: ['viewports'],
      options: { rotation: 90 },
    },
    rotateViewportCCW: {
      commandFn: actions.rotateViewport,
      storeContexts: ['viewports'],
      options: { rotation: -90 },
    },
    invertViewport: {
      commandFn: actions.invertViewport,
      storeContexts: ['viewports'],
      options: {},
    },
    flipViewportVertical: {
      commandFn: actions.flipViewportVertical,
      storeContexts: ['viewports'],
      options: {},
    },
    flipViewportHorizontal: {
      commandFn: actions.flipViewportHorizontal,
      storeContexts: ['viewports'],
      options: {},
    },
    scaleUpViewport: {
      commandFn: actions.scaleViewport,
      storeContexts: ['viewports'],
      options: { direction: 1 },
    },
    scaleDownViewport: {
      commandFn: actions.scaleViewport,
      storeContexts: ['viewports'],
      options: { direction: -1 },
    },
    fitViewportToWindow: {
      commandFn: actions.scaleViewport,
      storeContexts: ['viewports'],
      options: { direction: 0 },
    },
    resetViewport: {
      commandFn: actions.resetViewport,
      storeContexts: ['viewports'],
      options: {},
    },
    clearAnnotations: {
      commandFn: actions.clearAnnotations,
      storeContexts: ['viewports'],
      options: {},
    },
    nextImage: {
      commandFn: actions.nextImage,
      storeContexts: ['viewports'],
      options: {},
    },
    previousImage: {
      commandFn: actions.previousImage,
      storeContexts: ['viewports'],
      options: {},
    },
    // TOOLS
    setToolActive: {
      commandFn: actions.setToolActive,
      storeContexts: [],
      options: {},
    },
    setZoomTool: {
      commandFn: actions.setToolActive,
      storeContexts: [],
      options: { toolName: 'Zoom' },
    },
    setCornerstoneLayout: {
      commandFn: actions.setCornerstoneLayout,
      storeContexts: [],
      options: {},
      context: 'VIEWER',
    },
    setWindowLevel: {
      commandFn: actions.setWindowLevel,
      storeContexts: ['viewports'],
      options: {},
    },
    subscribeToContextMenuHandler: {
      commandFn: actions.subscribeToContextMenuHandler,
      storeContexts: [],
      options: {},
    },
    cancelTask: {
      commandFn: actions.cancelTask,
      storeContexts: [],
      options: {},
    },
    toggleReferenceLines: {
      commandFn: ({ evt }) => {
        referenceLines.enabled = !referenceLines.enabled;
        referenceLines.display(getActiveViewportIndex());
      },
      storeContexts: [],
      options: { evt: null },
    },
    getWindowing: {
      commandFn: ({ viewportIndex }) => {
        const enabledElement = cornerstone.getEnabledElements()[viewportIndex];
        if (enabledElement) {
          return getWindowing(enabledElement.uuid);
        }
      },
      storeContexts: [],
      options: { viewportIndex: null },
    },
  };

  return {
    actions,
    definitions,
    defaultContext: 'ACTIVE_VIEWPORT::CORNERSTONE',
  };
};

export default commandsModule;
