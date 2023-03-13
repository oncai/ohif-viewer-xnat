import sessionMap from '../../../../utils/sessionMap';
import fetchCSRFToken from '../../../../utils/IO/fetchCSRFToken';
// import { saveFile } from '../../../../utils/xnatDev';

const storeMeasurementCollection = async (serializedJson, paras) => {
  // const dataBlob = new Blob([serializedJson], { type: 'application/json' });
  // saveFile(dataBlob, 'measurementData.json');
  // return Promise.resolve();

  const { collectionLabel, SeriesInstanceUID } = paras;
  const xnatRootUrl = sessionMap.xnatRootUrl;
  const projectID = sessionMap.getProject();
  const experimentID = sessionMap.getScan(SeriesInstanceUID, 'experimentId');

  const csrfToken = await fetchCSRFToken();
  const csrfTokenParameter = `XNAT_CSRF=${csrfToken}`;
  let putUrl = `${xnatRootUrl}xapi/roi/projects/${projectID}`;
  putUrl += `/sessions/${experimentID}/collections/${collectionLabel}`;
  putUrl += `?type=MEAS&overwrite=false&${csrfTokenParameter}`;

  const dataBlob = new Blob([serializedJson], { type: 'application/json' });

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      console.log(`Request returned, status: ${xhr.status}`);
      if (xhr.status === 200 || xhr.status === 201) {
        resolve();
      } else {
        reject(xhr.responseText || xhr.statusText);
      }
    };

    xhr.onerror = () => {
      console.log(`Request returned, status: ${xhr.status}`);
      reject(xhr.responseText || xhr.statusText);
    };

    xhr.open('PUT', putUrl);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.send(dataBlob);
  });
};

export default storeMeasurementCollection;
