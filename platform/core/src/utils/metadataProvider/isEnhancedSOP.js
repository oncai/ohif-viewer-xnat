import { sopClassDictionary } from '../sopClassDictionary';

// ToDo: add support for other Enhanced SOPs
const supportedEnhancedSOPs = [
  sopClassDictionary.EnhancedMRImageStorage,
  sopClassDictionary.NuclearMedicineImageStorage,
];

const isEnhancedSOP = SOPClassUID => {
  return supportedEnhancedSOPs.includes(SOPClassUID);
};

export default isEnhancedSOP;
