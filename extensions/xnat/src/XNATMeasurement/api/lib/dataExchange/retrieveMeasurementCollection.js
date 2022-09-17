import { readFile } from '../../../../utils/xnatDev';

const retrieveMeasurementCollection = async sessionData => {
  const buffer = await readFile(true);
  const collectionObject = JSON.parse(buffer);
  return collectionObject;
};

export default retrieveMeasurementCollection;
