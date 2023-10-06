import isSameArray from './isSameArray';

const isSameOrientation = instances => {
  const n = instances.length;
  const imageI = instances[0].metadata;
  const iopI = imageI.ImageOrientationPatient;

  for (let ii = 1; ii < n; ++ii) {
    const image = instances[ii].metadata;
    const { ImageOrientationPatient: iop } = image;
    if (!isSameArray(iop, iopI)) {
      return false;
    }
  }

  return true;
};

export default isSameOrientation;
