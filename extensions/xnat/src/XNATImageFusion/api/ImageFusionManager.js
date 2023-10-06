import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import OHIF from '@ohif/core';
import { colormapList, getColormap } from '../utils/fusionColormaps';
import DEFAULT_FUSION_DATA from '../constants/DeafultFusionData';
import XNATFusionRenderer from '../stackTools/XNATFusionRenderer';

const { getToolState } = csTools;
const { studyMetadataManager, StackManager } = OHIF.utils;

class ImageFusionManager {
  constructor() {}

  getDefaultFusionData() {
    return { ...DEFAULT_FUSION_DATA };
  }

  getColormapList() {
    return colormapList;
  }

  applyFusion(imageFusionData, enabledElement) {
    // Reset current fusion, if exists
    this.reset(enabledElement);

    const imageStacks = this._addFusionStack(imageFusionData, enabledElement);

    const element = enabledElement.element;

    const fusionRenderer = XNATFusionRenderer.addToToolState(
      element,
      imageStacks
    );
    if (fusionRenderer) {
      fusionRenderer.currentImageIdIndex = imageStacks[0].currentImageIdIndex;
      fusionRenderer.render(element);
    }
  }

  reset(enabledElement) {
    // ToDo: Should we stop the cine?
    // stopClip(element);

    const element = enabledElement.element;

    // Clear the stack renderer tool state
    XNATFusionRenderer.clearFromToolState(element);

    // Remove the foreground scan stack
    this._removeFusionStack(enabledElement);

    // Remove layers configuration
    cornerstone.purgeLayers(element);

    cornerstone.updateImage(element);
  }

  updateFusionLayer(imageFusionData, enabledElement) {
    const { colormap, opacity } = imageFusionData;

    let layer;
    if (enabledElement.layers && enabledElement.layers.length > 1) {
      layer = enabledElement.layers[1];
    }

    if (!layer) {
      return;
    }

    if (colormap !== undefined) {
      const colormapIdOrObject = getColormap(colormap);
      let getFalseColorImage;
      let newColormap;
      if (typeof colormapIdOrObject === 'object') {
        if (
          colormapIdOrObject.requiresFalseColorImage &&
          colormapIdOrObject.getFalseColorImage
        ) {
          getFalseColorImage = colormapIdOrObject.getFalseColorImage;
        }
      } else {
        newColormap = colormapIdOrObject;
      }

      layer.options.viewport = {
        colormap: newColormap,
        getFalseColorImage,
      };
      layer.viewport.colormap = newColormap;
    }

    if (opacity !== undefined) {
      layer.options.opacity = opacity;
    }

    const element = enabledElement.element;
    const stackRendererData = getToolState(element, 'stackRenderer');
    if (
      stackRendererData &&
      stackRendererData.data &&
      stackRendererData.data.length
    ) {
      const stackRenderer = stackRendererData.data[0];
      stackRenderer.render(element);
    } else {
      cornerstone.updateImage(enabledElement.element, true);
    }
  }

  _addFusionStack(imageFusionData, enabledElement) {
    const {
      StudyInstanceUID,
      displaySetInstanceUID,
      colormap,
      opacity,
    } = imageFusionData;

    const studies = studyMetadataManager.all();
    const study = studies.find(
      study =>
        study.getStudyInstanceUID() === StudyInstanceUID &&
        study.displaySets.some(
          ds => ds.displaySetInstanceUID === displaySetInstanceUID
        )
    );
    const displaySet = study.displaySets.find(set => {
      return set.displaySetInstanceUID === displaySetInstanceUID;
    });

    // Get and clone the stack
    const storedStack = StackManager.findOrCreateStack(study, displaySet);
    const stack = Object.assign({}, storedStack);

    const toolStateManager = enabledElement.toolStateManager;

    const stackToolStateData = toolStateManager.toolState['stack'].data;
    const baseStackData = stackToolStateData[0];

    const colormapIdOrObject = getColormap(colormap);
    let getFalseColorImage;
    let newColormap;
    if (typeof colormapIdOrObject === 'object') {
      if (
        colormapIdOrObject.requiresFalseColorImage &&
        colormapIdOrObject.getFalseColorImage
      ) {
        getFalseColorImage = colormapIdOrObject.getFalseColorImage;
      }
    } else {
      newColormap = colormapIdOrObject;
    }

    const foreStackData = {
      imageIds: stack.imageIds,
      currentImageIdIndex: baseStackData.currentImageIdIndex,
      options: {
        opacity,
        viewport: {
          colormap: newColormap,
          getFalseColorImage,
        },
      },
    };

    // Add the stack of the foreground scan
    stackToolStateData.push(foreStackData);

    return [baseStackData, foreStackData];
  }

  _removeFusionStack(enabledElement) {
    const toolStateManager = enabledElement.toolStateManager;
    const stackToolStateData = toolStateManager.toolState['stack'].data;
    // Keep the base stack only
    stackToolStateData.splice(1);
  }
}

const imageFusionManager = new ImageFusionManager();

export default imageFusionManager;
