import { sopClassDictionary } from '../sopClassDictionary';

const isEnhancedSOP = SOPClassUID => {
  // Enhanced MR Image Storage
  if (SOPClassUID === sopClassDictionary.EnhancedMRImageStorage) {
    return true;
  }
  // ToDo: add support for other Enhanced SOPs

  return false;
};

export default isEnhancedSOP;
