import throttle from 'lodash.throttle';
import {
  vtkInteractorStyleMPRWindowLevel,
  vtkInteractorStyleRotatableMPRCrosshairs,
  vtkSVGRotatableCrosshairsWidget,
  vtkInteractorStyleMPRRotate,
} from 'react-vtkjs-viewport';
import { getImageData } from 'react-vtkjs-viewport';
import { vec3 } from 'gl-matrix';
import setMPRLayout from './utils/setMPRLayout.js';
import setViewportToVTK from './utils/setViewportToVTK.js';
import Constants from '@kitware/vtk.js/Rendering/Core/VolumeMapper/Constants';
import OHIFVTKViewport from './OHIFVTKViewport';
import setOrientationMarker, {
  readHumanMarker,
  ORIENTATION_MARKER_TYPE,
} from './utils/setOrientationMarker';
import getVOIFromCornerstoneViewport from './utils/getVOIFromCornerstoneViewport';
import volumeProperties from './utils/volumeProperties';
import { volumeCache } from './utils/viewportDataCache';
import { contourRenderingApi } from './utils/contourRois';

const { BlendMode } = Constants;

const commandsModule = ({ commandsManager, servicesManager }) => {
  const { UINotificationService, LoggerService } = servicesManager.services;

  // TODO: Put this somewhere else
  let apis = {};
  let defaultVOI;
  let currentVolume;
  let displaySetInstanceUID;

  async function _getActiveViewportVTKApi(viewports) {
    const {
      numRows,
      numColumns,
      layout,
      viewportSpecificData,
      activeViewportIndex,
    } = viewports;

    const currentData = layout.viewports[activeViewportIndex];
    if (currentData && currentData.plugin === 'vtk') {
      // TODO: I was storing/pulling this from Redux but ran into weird issues
      if (apis[activeViewportIndex]) {
        return apis[activeViewportIndex];
      }
    }

    const displaySet = viewportSpecificData[activeViewportIndex];
    let api;
    if (!api) {
      try {
        api = await setViewportToVTK(
          displaySet,
          activeViewportIndex,
          numRows,
          numColumns,
          layout,
          viewportSpecificData
        );
      } catch (error) {
        throw new Error(error);
      }
    }

    return api;
  }

  function _setView(api, sliceNormal, viewUp) {
    const renderWindow = api.genericRenderWindow.getRenderWindow();
    const istyle = renderWindow.getInteractor().getInteractorStyle();
    istyle.setSliceNormal(...sliceNormal);
    istyle.setViewUp(...viewUp);

    renderWindow.render();
  }

  function setVOI() {
    let windowWidth = 1;
    let windowCenter = 0;
    const voiRange = volumeProperties.applyUserPropertiesToVolume(
      displaySetInstanceUID,
      false
    );

    if (voiRange) {
      windowWidth = voiRange[1] - voiRange[0];
      windowCenter = voiRange[0] + windowWidth / 2;
    }

    apis.forEach(api => {
      api.updateVOI(windowWidth, windowCenter);
    });
  }

  const _convertModelToWorldSpace = (position, vtkImageData) => {
    const indexToWorld = vtkImageData.getIndexToWorld();
    const pos = vec3.create();

    position[0] += 0.5; /* Move to the centre of the voxel. */
    position[1] += 0.5; /* Move to the centre of the voxel. */
    position[2] += 0.5; /* Move to the centre of the voxel. */

    vec3.set(pos, position[0], position[1], position[2]);
    vec3.transformMat4(pos, pos, indexToWorld);

    return pos;
  };

  const actions = {
    updateVtkApi: ({ viewportIndex }) => {
      if (viewportIndex === undefined) {
        apis.forEach(api => {
          api.updateImage();
        });
      } else {
        apis[viewportIndex].updateImage();
      }
    },
    getVtkApis: ({ index }) => {
      return apis[index];
    },
    resetMPRView() {
      // Reset orientation
      apis.forEach(api => api.resetOrientation());

      // Reset VOI
      setVOI();

      // Reset the crosshairs
      apis[0].svgWidgets.rotatableCrosshairsWidget.resetCrosshairs(apis, 0);
    },
    axial: async ({ viewports }) => {
      const api = await _getActiveViewportVTKApi(viewports);

      apis[viewports.activeViewportIndex] = api;

      _setView(api, [0, 0, 1], [0, -1, 0]);
    },
    sagittal: async ({ viewports }) => {
      const api = await _getActiveViewportVTKApi(viewports);

      apis[viewports.activeViewportIndex] = api;

      _setView(api, [1, 0, 0], [0, 0, 1]);
    },
    coronal: async ({ viewports }) => {
      const api = await _getActiveViewportVTKApi(viewports);

      apis[viewports.activeViewportIndex] = api;

      _setView(api, [0, 1, 0], [0, 0, 1]);
    },
    requestNewSegmentation: async ({ viewports }) => {
      const allViewports = Object.values(viewports.viewportSpecificData);
      const promises = allViewports.map(async (viewport, viewportIndex) => {
        let api = apis[viewportIndex];

        if (!api) {
          api = await _getActiveViewportVTKApi(viewports);
          apis[viewportIndex] = api;
        }

        api.requestNewSegmentation();
        api.updateImage();
      });
      await Promise.all(promises);
    },
    jumpToSlice: async ({
      viewports,
      studies,
      StudyInstanceUID,
      displaySetInstanceUID,
      SOPClassUID,
      SOPInstanceUID,
      segmentNumber,
      frameIndex,
      frame,
      done = () => {},
    }) => {
      let api = apis[viewports.activeViewportIndex];

      if (!api) {
        api = await _getActiveViewportVTKApi(viewports);
        apis[viewports.activeViewportIndex] = api;
      }

      const stack = OHIFVTKViewport.getCornerstoneStack(
        studies,
        StudyInstanceUID,
        displaySetInstanceUID,
        SOPClassUID,
        SOPInstanceUID,
        frameIndex
      );

      const imageDataObject = getImageData(
        stack.imageIds,
        displaySetInstanceUID
      );

      let pixelIndex = 0;
      let x = 0;
      let y = 0;
      let count = 0;

      const rows = imageDataObject.dimensions[1];
      const cols = imageDataObject.dimensions[0];

      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          // [i, j] =
          const pixel = frame.pixelData[pixelIndex];
          if (pixel === segmentNumber) {
            x += i;
            y += j;
            count++;
          }
          pixelIndex++;
        }
      }
      x /= count;
      y /= count;

      const position = [x, y, frameIndex];
      const worldPos = _convertModelToWorldSpace(
        position,
        imageDataObject.vtkImageData
      );

      api.svgWidgets.rotatableCrosshairsWidget.moveCrosshairs(worldPos, apis);
      done();
    },
    setSegmentationConfiguration: async ({
      viewports,
      globalOpacity,
      visible,
      renderOutline,
      outlineThickness,
    }) => {
      const allViewports = Object.values(viewports.viewportSpecificData);
      const promises = allViewports.map(async (viewport, viewportIndex) => {
        let api = apis[viewportIndex];

        if (!api) {
          api = await _getActiveViewportVTKApi(viewports);
          apis[viewportIndex] = api;
        }

        api.setGlobalOpacity(globalOpacity);
        api.setVisibility(visible);
        api.setOutlineThickness(outlineThickness);
        api.setOutlineRendering(renderOutline);
        api.updateImage();
      });
      await Promise.all(promises);
    },
    setSegmentConfiguration: async ({ viewports, visible, segmentNumber }) => {
      const allViewports = Object.values(viewports.viewportSpecificData);
      const promises = allViewports.map(async (viewport, viewportIndex) => {
        let api = apis[viewportIndex];

        if (!api) {
          api = await _getActiveViewportVTKApi(viewports);
          apis[viewportIndex] = api;
        }

        api.setSegmentVisibility(segmentNumber, visible);
        api.updateImage();
      });
      await Promise.all(promises);
    },
    enableRotateTool: () => {
      apis.forEach((api, apiIndex) => {
        const istyle = vtkInteractorStyleMPRRotate.newInstance();

        api.setInteractorStyle({
          istyle,
          configuration: { apis, apiIndex, uid: api.uid },
        });
      });
    },
    enableCrosshairsTool: () => {
      apis.forEach((api, apiIndex) => {
        const istyle = vtkInteractorStyleRotatableMPRCrosshairs.newInstance();

        api.setInteractorStyle({
          istyle,
          callbacks: {
            onModified: api.orientationWidget.updateMarkerOrientation,
          },
          configuration: {
            apis,
            apiIndex,
            uid: api.uid,
          },
        });
      });

      const rotatableCrosshairsWidget =
        apis[0].svgWidgets.rotatableCrosshairsWidget;

      const referenceLines = rotatableCrosshairsWidget.getReferenceLines();

      // Initilise crosshairs if not initialised.
      if (!referenceLines) {
        rotatableCrosshairsWidget.resetCrosshairs(apis, 0);
      }
    },
    enableLevelTool: () => {
      function updateVOI(apis, windowWidth, windowCenter) {
        apis.forEach(api => {
          api.updateVOI(windowWidth, windowCenter);
        });
      }

      const throttledUpdateVOIs = throttle(updateVOI, 16, { trailing: true }); // ~ 60 fps

      const callbacks = {
        setOnLevelsChanged: ({ windowCenter, windowWidth }) => {
          apis.forEach(api => {
            const renderWindow = api.genericRenderWindow.getRenderWindow();

            renderWindow.render();
          });

          throttledUpdateVOIs(apis, windowWidth, windowCenter);
        },
      };

      apis.forEach((api, apiIndex) => {
        const istyle = vtkInteractorStyleMPRWindowLevel.newInstance();

        api.setInteractorStyle({
          istyle,
          callbacks,
          configuration: { apis, apiIndex, uid: api.uid },
        });
      });
    },
    setSlabThickness: ({ slabThickness }) => {
      apis.forEach(api => {
        api.setSlabThickness(slabThickness);
      });
    },
    changeSlabThickness: ({ change }) => {
      apis.forEach(api => {
        const slabThickness = Math.max(api.getSlabThickness() + change, 0.1);

        api.setSlabThickness(slabThickness);
      });
    },
    setBlendMode: ({ blendMode }) => {
      // Apply blend mode to all cached volumes
      for (let volume of volumeCache.values()) {
        const mapper = volume.getMapper();
        if (mapper.setBlendMode) {
          mapper.setBlendMode(blendMode);
        }
      }
      // Update renderer
      apis.forEach(api => {
        const renderWindow = api.genericRenderWindow.getRenderWindow();
        if (blendMode === BlendMode.COMPOSITE_BLEND) {
          api.setSlabThickness(0.1);
        }
        renderWindow.render();
      });
    },
    mpr2d: async ({ viewports }) => {
      document.querySelector(`.ViewerMain`).style.pointerEvents = 'none';
      // TODO push a lot of this backdoor logic lower down to the library level.
      const displaySet =
        viewports.viewportSpecificData[viewports.activeViewportIndex];

      // Get current VOI if cornerstone viewport.
      const cornerstoneVOI = getVOIFromCornerstoneViewport();
      defaultVOI = cornerstoneVOI;

      const viewportProps = [
        {
          //Axial
          orientation: {
            sliceNormal: [0, 0, 1],
            viewUp: [0, -1, 0],
          },
        },
        {
          // Sagittal
          orientation: {
            sliceNormal: [1, 0, 0],
            viewUp: [0, 0, 1],
          },
        },
        {
          // Coronal
          orientation: {
            sliceNormal: [0, 1, 0],
            viewUp: [0, 0, 1],
          },
        },
      ];

      let orientationMarkerType = ORIENTATION_MARKER_TYPE.CUBE;
      try {
        apis = await setMPRLayout(displaySet, viewportProps, 1, 3);
        if (await readHumanMarker()) {
          orientationMarkerType = ORIENTATION_MARKER_TYPE.HUMAN;
        }
      } catch (error) {
        throw new Error(error);
      } finally {
        document.querySelector(`.ViewerMain`).style.pointerEvents = '';
      }

      displaySetInstanceUID = displaySet.displaySetInstanceUID;
      currentVolume = volumeCache.get(displaySet.displaySetInstanceUID);

      // if (cornerstoneVOI) {
      //   setVOI(cornerstoneVOI);
      // }

      // Add widgets and set default interactorStyle of each viewport.
      apis.forEach((api, apiIndex) => {
        api.addSVGWidget(
          vtkSVGRotatableCrosshairsWidget.newInstance(),
          'rotatableCrosshairsWidget'
        );

        const uid = api.uid;
        const istyle = vtkInteractorStyleRotatableMPRCrosshairs.newInstance();

        setOrientationMarker(api, orientationMarkerType);

        api.setInteractorStyle({
          istyle,
          callbacks: {
            onModified: api.orientationWidget.updateMarkerOrientation,
          },
          configuration: { apis, apiIndex, uid },
        });

        api.svgWidgets.rotatableCrosshairsWidget.setApiIndex(apiIndex);
        api.svgWidgets.rotatableCrosshairsWidget.setApis(apis);
      });

      // Initialise crosshairs
      apis[0].svgWidgets.rotatableCrosshairsWidget.resetCrosshairs(apis, 0);

      // Check if we have full WebGL 2 support
      const openGLRenderWindow = apis[0].genericRenderWindow.getOpenGLRenderWindow();

      if (!openGLRenderWindow.getWebgl2()) {
        // Throw a warning if we don't have WebGL 2 support,
        // And the volume is too big to fit in a 2D texture

        const openGLContext = openGLRenderWindow.getContext();
        const maxTextureSizeInBytes = openGLContext.getParameter(
          openGLContext.MAX_TEXTURE_SIZE
        );

        const maxBufferLengthFloat32 =
          (maxTextureSizeInBytes * maxTextureSizeInBytes) / 4;

        const dimensions = currentVolume
          .getMapper()
          .getInputData()
          .getDimensions();

        const volumeLength = dimensions[0] * dimensions[1] * dimensions[2];

        if (volumeLength > maxBufferLengthFloat32) {
          const message =
            'This volume is too large to fit in WebGL 1 textures and will display incorrectly. Please use a different browser to view this data';
          LoggerService.error({ message });
          UINotificationService.show({
            title: 'Browser does not support WebGL 2',
            message,
            type: 'error',
            autoClose: false,
          });
        }
      }

      // Update contour ROI data from cornerstone-tools
      contourRenderingApi.init(displaySet.SeriesInstanceUID, apis);
    },
  };

  window.vtkActions = actions;

  const definitions = {
    requestNewSegmentation: {
      commandFn: actions.requestNewSegmentation,
      storeContexts: ['viewports'],
      options: {},
    },
    jumpToSlice: {
      commandFn: actions.jumpToSlice,
      storeContexts: ['viewports'],
      options: {},
    },
    setSegmentationConfiguration: {
      commandFn: actions.setSegmentationConfiguration,
      storeContexts: ['viewports'],
      options: {},
    },
    setSegmentConfiguration: {
      commandFn: actions.setSegmentConfiguration,
      storeContexts: ['viewports'],
      options: {},
    },
    axial: {
      commandFn: actions.axial,
      storeContexts: ['viewports'],
      options: {},
    },
    coronal: {
      commandFn: actions.coronal,
      storeContexts: ['viewports'],
      options: {},
    },
    sagittal: {
      commandFn: actions.sagittal,
      storeContexts: ['viewports'],
      options: {},
    },
    enableRotateTool: {
      commandFn: actions.enableRotateTool,
      options: {},
    },
    enableCrosshairsTool: {
      commandFn: actions.enableCrosshairsTool,
      options: {},
    },
    enableLevelTool: {
      commandFn: actions.enableLevelTool,
      options: {},
    },
    resetMPRView: {
      commandFn: actions.resetMPRView,
      options: {},
    },
    setBlendModeToComposite: {
      commandFn: actions.setBlendMode,
      options: { blendMode: BlendMode.COMPOSITE_BLEND },
    },
    setBlendModeToMaximumIntensity: {
      commandFn: actions.setBlendMode,
      options: { blendMode: BlendMode.MAXIMUM_INTENSITY_BLEND },
    },
    setBlendModeToMinimumIntensity: {
      commandFn: actions.setBlendMode,
      options: { blendMode: BlendMode.MINIMUM_INTENSITY_BLEND },
    },
    setBlendModeToAverageIntensity: {
      commandFn: actions.setBlendMode,
      options: { blendMode: BlendMode.AVERAGE_INTENSITY_BLEND },
    },
    setSlabThickness: {
      // TODO: How do we pass in a function argument?
      commandFn: actions.setSlabThickness,
      options: {},
    },
    increaseSlabThickness: {
      commandFn: actions.changeSlabThickness,
      options: {
        change: 3,
      },
    },
    decreaseSlabThickness: {
      commandFn: actions.changeSlabThickness,
      options: {
        change: -3,
      },
    },
    mpr2d: {
      commandFn: actions.mpr2d,
      storeContexts: ['viewports'],
      options: {},
      context: 'VIEWER',
    },
    getVtkApiForViewportIndex: {
      commandFn: actions.getVtkApis,
      context: 'VIEWER',
    },
    updateVtkApi: {
      commandFn: actions.updateVtkApi,
    },
  };

  return {
    definitions,
    defaultContext: 'ACTIVE_VIEWPORT::VTK',
  };
};

export default commandsModule;
