import createDicomVolume from './createDicomVolume';
import createNiftiVolume from './createNiftiVolume';
import readNifti from './readNifti';
import readNrrd from './readNrrd';

const reformat = {
  createDicomVolume,
  createNiftiVolume,
  readNifti,
  readNrrd,
};

export default reformat;
