import { saveFile } from '../../../../utils/xnatDev';

const storeMeasurementCollection = (serializedJson, sessionData) => {
  const dataBlob = new Blob([serializedJson], { type: 'application/json' });
  saveFile(dataBlob, 'measurementData.json');
  return Promise.resolve();
};

export default storeMeasurementCollection;
