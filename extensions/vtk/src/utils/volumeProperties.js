import { cloneDeep } from 'lodash';
import vtkColorMaps from './colorMaps/ColorMaps';

const volumeDataMap = new Map();

class VolumeProperties {
  registerVolume(
    displaySetInstanceUID,
    volume,
    voiLut,
    modality,
    modalitySpecificScalingParameters
  ) {
    volumeDataMap.set(displaySetInstanceUID, {
      volume,
      properties: {
        voiRange: [voiLut.lower, voiLut.upper],
        modality,
        modalitySpecificScalingParameters,
      },
    });
  }

  initVolume(displaySetInstanceUID) {
    const volumeData = volumeDataMap.get(displaySetInstanceUID);
    if (!volumeData) {
      return;
    }

    if (volumeData.properties.initialized) {
      // Volume was already initiated
      return;
    }

    const { voiRange } = volumeData.properties;
    const voi = [...voiRange];

    const mapper = volumeData.volume.getMapper();
    const dataRange = mapper
      .getInputData()
      .getPointData()
      .getScalars()
      .getRange();

    // Set voi to be within the actual data range
    // - voi new values affect foreground/fused volumes only
    if (voi[0] < dataRange[0]) {
      voi[0] = dataRange[0];
    }
    if (voi[1] > dataRange[1]) {
      voi[1] = dataRange[1];
    }

    /*
    // Middle points
    const interval = 1 / 50;
    const middlePoints = [
      dataRange[1] * interval,
      dataRange[1] * (1 - interval),
    ];

    // Move voi awafrom the data range edges
    /*if (Math.abs(voi[0] - dataRange[0]) < interval) {
      voi[0] = middlePoints[0];
    }
    if (Math.abs(voi[1] - dataRange[1]) < interval) {
      voi[1] = middlePoints[1];
    }
    */

    const opacityBg = [[0, 1.0], [1024, 1.0]];

    const opacityFg = [];
    opacityFg.push([dataRange[0], 0.0]);
    opacityFg.push([voi[0], 0.95]);
    opacityFg.push([voi[1], 0.99]);
    opacityFg.push([dataRange[1], 1.0]);

    const rescaleColormap = true;

    const defaults = {
      // Background volume properties
      bg: {
        dataRange: [...dataRange],
        //
        voiRange: [...voiRange],
        colormap: vtkColorMaps.defaultBackgroundColormap,
        opacity: cloneDeep(opacityBg),
        globalOpacity: 1.0,
        visible: true,
        rescaleColormap: true, // always true
      },
      // Foreground (fused) volume properties
      fg: {
        dataRange: [...dataRange],
        //
        voiRange: rescaleColormap ? [...voi] : [...dataRange],
        colormap: vtkColorMaps.defaultForegroundColormap,
        opacity: cloneDeep(opacityFg),
        globalOpacity: 1.0,
        visible: true,
        rescaleColormap: rescaleColormap,
      },
    };

    volumeData.properties = {
      ...volumeData.properties,
      initialized: true,
      dataRange,
      defaults,
      user: cloneDeep(defaults),
    };

    // Enhance opacity rendering
    // - the unit distance on which the scalar opacity transfer function is defined
    volumeData.volume.getProperty().setScalarOpacityUnitDistance(0, 0.5);
    mapper.setAutoAdjustSampleDistances(0);
    mapper.setSampleDistance(0.5);
    mapper.setMaximumSamplesPerRay(14000);
  }

  isInitialized(displaySetInstanceUID) {
    const volumeData = volumeDataMap.get(displaySetInstanceUID);
    if (!volumeData) {
      return false;
    }

    return volumeData.properties.initialized || false;
  }

  getVolume(displaySetInstanceUID) {
    const volumeData = volumeDataMap.get(displaySetInstanceUID);
    if (!volumeData) {
      return;
    }

    return volumeData.volume;
  }

  getProperties(displaySetInstanceUID, options = {}) {
    const volumeData = volumeDataMap.get(displaySetInstanceUID);
    if (!volumeData) {
      return;
    }

    if (!volumeData.properties.initialized) {
      // Volume was not initiated yet
      return;
    }

    if (options.source) {
      return cloneDeep(volumeData.properties[options.source]);
    }

    return cloneDeep(volumeData.properties);
  }

  updateUserProperties(displaySetInstanceUID, userProperties) {
    const volumeData = volumeDataMap.get(displaySetInstanceUID);
    if (!volumeData) {
      return;
    }

    const { bg, fg } = volumeData.properties.user;

    const newProperties = cloneDeep(userProperties);
    volumeData.properties.user = {
      bg: newProperties.bg ? { ...bg, ...newProperties.bg } : { ...bg },
      fg: newProperties.fg ? { ...fg, ...newProperties.fg } : { ...fg },
    };

    // Update opacity for foreground properties
    if (newProperties.fg) {
      const { opacity, voiRange, dataRange } = volumeData.properties.user.fg;
      opacity[0][0] = dataRange[0];
      opacity[1][0] = voiRange[0];
      opacity[2][0] = voiRange[1];
      opacity[3][0] = dataRange[1];
    }
  }

  resetUserPropertiesToDefaults(displaySetInstanceUID, options = {}) {
    const volumeData = volumeDataMap.get(displaySetInstanceUID);
    if (!volumeData) {
      return;
    }

    const user = cloneDeep(volumeData.properties.defaults);

    volumeData.properties = {
      ...volumeData.properties,
      user,
    };
  }

  setColorAndOpacityUsingVoi(volume, colorRange) {
    const colormap = 'Grayscale';
    const opacity = [[0, 1.0], [1024, 1.0]];
    const globalOpacity = 1.0;

    _updateVolumeColor(volume, colorRange, colormap);
    _updateVolumeOpacity(volume, opacity, globalOpacity);
  }

  /**
   * @param displaySetInstanceUID
   * @param isFg: is foreground volume (fusion)
   * @return voiRange
   */
  applyUserPropertiesToVolume(displaySetInstanceUID, isFg) {
    const volumeData = volumeDataMap.get(displaySetInstanceUID);
    if (!volumeData) {
      return;
    }

    const selector = isFg ? 'fg' : 'bg';
    const {
      dataRange,
      voiRange,
      colormap,
      opacity,
      globalOpacity,
      visible,
      rescaleColormap
    } = volumeData.properties.user[selector];

    volumeData.volume.setVisibility(visible);

    const colorRange = rescaleColormap ? voiRange : dataRange;
    _updateVolumeColor(volumeData.volume, colorRange, colormap);
    _updateVolumeOpacity(volumeData.volume, opacity, globalOpacity);

    return voiRange;
  }
}

function _updateVolumeColor(volume, colorRange, colormap) {
  const preset = vtkColorMaps.getPresetByName(colormap);
  const cfun = volume.getProperty().getRGBTransferFunction(0);
  cfun.applyColorMap(preset);
  cfun.setMappingRange(...colorRange);
  cfun.updateRange();
}

function _updateVolumeOpacity(volume, opacity, globalOpacity) {
  const ofun = volume.getProperty().getScalarOpacity(0);
  ofun.removeAllPoints();
  opacity.forEach(value => ofun.addPoint(value[0], value[1] * globalOpacity));
  ofun.updateRange();
}

const volumeProperties = new VolumeProperties();

export default volumeProperties;
