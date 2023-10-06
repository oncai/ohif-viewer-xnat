import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';

const { getToolState } = csTools;
const convertToVector3 = csTools.importInternal('util/convertToVector3');

const toolName = 'stackRenderer';

const createLoadingIndicator = () => {
  const indicatorDiv = document.createElement('div');
  indicatorDiv.id = 'layerLoadingIndicator';
  indicatorDiv.innerHTML = 'Loading Fusion Image ...';
  indicatorDiv.style.cssText =
    'position: absolute; ' +
    'color: #9ccef9; ' +
    'width: 100%; ' +
    'height: 100%; ' +
    'top: 60%; ' +
    'text-align: center; ' +
    'text-shadow: 1px 1px #000; ' +
    'pointer-events: none;';

  return indicatorDiv;
};

export default class XNATFusionRenderer {
  constructor() {
    this.currentImageIdIndex = 0;
    this.layerIds = [];

    this.currentForeImageId = undefined;
    this.correspondingImageIds = {};

    this.layerLoadingIndicator = createLoadingIndicator();
  }

  static addToToolState(element, imageStacks) {
    const enabledElement = cornerstone.getEnabledElement(element);
    const toolStateManager = enabledElement.toolStateManager;

    const toolState = toolStateManager.toolState;
    if (toolState.hasOwnProperty(toolName) === false) {
      toolState[toolName] = {
        data: [],
      };
    }

    const toolData = toolState[toolName];
    // Clear data to eliminate any previous stackrenderer
    toolData.data = [];

    const fusionRenderer = new this();
    fusionRenderer.init(imageStacks);

    toolData.data.push(fusionRenderer);

    return fusionRenderer;
  }

  static clearFromToolState(element) {
    const enabledElement = cornerstone.getEnabledElement(element);
    const toolStateManager = enabledElement.toolStateManager;

    const toolState = toolStateManager.toolState;
    if (toolState.hasOwnProperty(toolName) === false) {
      toolState[toolName] = {
        data: [],
      };
    }

    const toolData = toolState[toolName];
    toolData.data = [];
  }

  static getFromToolState(element) {
    const enabledElement = cornerstone.getEnabledElement(element);
    const toolStateManager = enabledElement.toolStateManager;

    const toolState = toolStateManager.toolState;
    if (toolState.hasOwnProperty(toolName) === false) {
      toolState[toolName] = {
        data: [],
      };
    }

    const toolData = toolState[toolName];
    toolData.data = [];

    return toolData.data[0];
  }

  init(imageStacks) {
    if (imageStacks.length < 2) {
      console.warn(
        'XNATFusionRenderer cannot be enabled, foreground stack is not available.'
      );
      return;
    }

    this.correspondingImageIds = this.getCorrespondingImageIds(
      imageStacks[0].imageIds,
      imageStacks[1].imageIds
    );
  }

  getCorrespondingImageIds(baseImageIds, foreImageIds) {
    const correspondingImageIds = {};

    const baseIppList = baseImageIds.map(
      imageId =>
        cornerstone.metaData.get('imagePlaneModule', imageId)
          .imagePositionPatient
    );

    const foreIppList = foreImageIds.map(
      imageId =>
        cornerstone.metaData.get('imagePlaneModule', imageId)
          .imagePositionPatient
    );

    baseIppList.forEach((baseIpp, baseIndex) => {
      if (baseIpp === undefined) {
        return;
      }

      const baseImageId = baseImageIds[baseIndex];
      const basePosition = convertToVector3(baseIpp);

      let minDistance = Number.MAX_VALUE;

      foreIppList.forEach((foreIpp, foreIndex) => {
        if (foreIpp === undefined) {
          return;
        }

        const foreImageId = foreImageIds[foreIndex];
        const forePosition = convertToVector3(foreIpp);

        const distance = forePosition.distanceToSquared(basePosition);
        if (distance < minDistance) {
          minDistance = distance;
          correspondingImageIds[baseImageId] = foreImageId;
        }
      });
    });

    return correspondingImageIds;
  }

  render(element, imageStacks) {
    // Move this to base Renderer class
    if (!Number.isInteger(this.currentImageIdIndex)) {
      throw new Error(
        'XNATFusionRenderer: render - Image ID Index is not an integer'
      );
    }

    if (!imageStacks) {
      const toolData = getToolState(element, 'stack');

      imageStacks = toolData.data;
    }
    // TODO: Figure out what to do with LoadHandlers in this scenario...

    // For the base layer, go to the currentImageIdIndex
    const baseImageObject = imageStacks[0];
    const currentImageId = baseImageObject.imageIds[this.currentImageIdIndex];
    const overlayImageStack = imageStacks[1];

    cornerstone.loadAndCacheImage(currentImageId).then(baseImage => {
      let baseLayerId = this.layerIds[0];

      // Get the base layer if one exists
      if (baseLayerId) {
        cornerstone.setLayerImage(element, baseImage, baseLayerId);
      } else {
        // Otherwise, create a new layer with the base layer's image
        baseLayerId = cornerstone.addLayer(
          element,
          baseImage,
          baseImageObject.options
        );
        this.layerIds.push(baseLayerId);
      }

      // Display the image immediately while the overlay images are identified
      cornerstone.displayImage(element, baseImage);

      if (overlayImageStack) {
        const imageId = this.correspondingImageIds[currentImageId];
        let currentLayerId = this.layerIds[1];

        // If no layer exists yet for this overlaid stack, create
        // One and add it to the layerIds property for this instance
        // Of the fusion renderer.
        if (!currentLayerId) {
          currentLayerId = cornerstone.addLayer(
            element,
            undefined,
            overlayImageStack.options
          );
          this.layerIds.push(currentLayerId);
        }

        this.currentForeImageId = imageId;

        if (imageId) {
          // Show the layer loading indicator
          if (element.querySelector('#layerLoadingIndicator') === null) {
            element.appendChild(this.layerLoadingIndicator);
          }
          // Clear the current image
          cornerstone.setLayerImage(element, undefined, currentLayerId);
          cornerstone.updateImage(element);
          // If an imageId was returned from the findImage function,
          // Load it, make sure it's visible and update the layer
          // With the new image object.
          // cornerstone.loadAndCacheImage(imageId).then(this.onLayerImageLoaded);
          cornerstone.loadAndCacheImage(imageId).then(image => {
            if (image.imageId === this.currentForeImageId) {
              // Clear the loading indicator
              if (element.querySelector('#layerLoadingIndicator')) {
                element.removeChild(this.layerLoadingIndicator);
              }

              let imageToRender;
              const layer = cornerstone.getLayer(element, currentLayerId);
              const optionsViewport = layer.options.viewport;

              if (
                optionsViewport.getFalseColorImage !== undefined &&
                !image.color
              ) {
                imageToRender = optionsViewport.getFalseColorImage(image);
              } else {
                imageToRender = image;
              }

              cornerstone.setLayerImage(element, imageToRender, currentLayerId);

              if (imageToRender.color) {
                layer.viewport.colormap = undefined;
              }

              cornerstone.updateImage(element, true);
            }
          });
        } else {
          // If no imageId was returned from the findImage function.
          // This means that there is no relevant image to display.
          cornerstone.setLayerImage(element, undefined, currentLayerId);
          cornerstone.setActiveLayer(element, baseLayerId);
          cornerstone.updateImage(element);
        }
      }
    });
  }
}
