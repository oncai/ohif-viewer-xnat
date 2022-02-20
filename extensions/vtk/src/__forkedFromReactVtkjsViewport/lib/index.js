import loadImageData from './loadImageData';
import getPatientWeightAndCorrectedDose from './data/getPatientWeightAndCorrectedDose';

const modalityScalingParametersFuncs = {
  PT: getPatientWeightAndCorrectedDose,
};

export { loadImageData };

export { modalityScalingParametersFuncs };
