import { saveFile } from '../../../../utils/xnatDev';

const storeMeasurements = (measurementData, sessionData) => {
  const imageBlob = new Blob([measurementData], { type: 'application/json' });
  saveFile(imageBlob, 'measurementData.json');
  return Promise.resolve();
};

export default storeMeasurements;
