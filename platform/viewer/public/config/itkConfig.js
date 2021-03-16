//
// itkModulesPath is the path that contains the directories
//
// - WebWorkers/
// - ImageIOs/
// - MeshIOs/
// - PolyDataIOs/
//
const PUBLIC_URL = process.env.PUBLIC_URL || '';

var itkConfig = {
  itkModulesPath: `${PUBLIC_URL}itk`
};

export default itkConfig;
