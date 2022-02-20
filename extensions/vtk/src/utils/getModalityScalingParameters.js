import { modalityScalingParametersFuncs } from '../__forkedFromReactVtkjsViewport';

const _cachedParameters = new Map();

const getModalityScalingParameters = (imageId, modality) => {
  if (_cachedParameters.has(imageId)) {
    return _cachedParameters.get(imageId);
  }

  let scalingParameters;
  try {
    if (modalityScalingParametersFuncs.hasOwnProperty(modality)) {
      scalingParameters = modalityScalingParametersFuncs[modality](imageId);
    }
  } catch (e) {
    throw e;
  } finally {
    _cachedParameters.set(imageId, scalingParameters);
  }

  return scalingParameters;
};

export default getModalityScalingParameters;
