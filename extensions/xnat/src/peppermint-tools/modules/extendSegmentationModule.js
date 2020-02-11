export default function extendSegmentationModule(segmentationModule, config) {
  const { state, getters, setters, configuration } = segmentationModule;

  // TODO -> Make sure all these are correct for each tool.
  configuration.holeFill = config.holeFill;
  configuration.holeFillRange = config.holeFillRange;
  configuration.strayRemove = config.strayRemove;
  configuration.strayRemoveRange = config.strayRemoveRange;
  configuration.gates = config.gates;
  configuration.activeGate = config.gates[0].name;
  configuration.maxRadius = config.maxRadius;

  getters.activeGateRange = () => {
    const activeGate = configuration.activeGate;
    const gates = configuration.gates;

    const gateIndex = gates.findIndex(element => {
      return element.name === activeGate;
    });

    return configuration.gates[gateIndex].range;
  };

  getters.customGateRange = () => {
    const gates = configuration.gates;

    const gateIndex = gates.findIndex(element => {
      return element.name === 'custom';
    });

    return configuration.gates[gateIndex].range;
  };

  setters.customGateRange = (min, max) => {
    const gates = configuration.gates;

    const gateIndex = gates.findIndex(element => {
      return element.name === 'custom';
    });

    const customGateRange = configuration.gates[gateIndex].range;

    if (min !== null) {
      customGateRange[0] = min;
    }

    if (max !== null) {
      customGateRange[1] = max;
    }
  };

  getters.importMetadata = seriesInstanceUid => {
    if (state.import && state.import[seriesInstanceUid]) {
      return state.import[seriesInstanceUid];
    }

    return;
  };

  setters.importMetadata = (seriesInstanceUid, metadata) => {
    // Store that we've imported a collection for this series.
    if (!state.import) {
      state.import = {};
    }

    state.import[seriesInstanceUid] = metadata;
  };

  setters.importModified = seriesInstanceUid => {
    const importMetadata = state.import[seriesInstanceUid];

    if (importMetadata.modified) {
      return;
    }

    importMetadata.modified = true;
  };
}
