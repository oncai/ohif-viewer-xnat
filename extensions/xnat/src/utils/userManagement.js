import sessionMap from './sessionMap.js';

function getSessionID() {
  const { xnatRootUrl } = sessionMap;
  const url = xnatRootUrl + 'data/JSESSION';

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(xhr.response);
      } else {
        reject('Error checking logged-in to XNAT');
      }
    };

    xhr.onerror = () => {
      reject('Error checking logged-in to XNAT' + xhr.responseText);
    };

    xhr.open('GET', url);
    xhr.timeout = 5000;
    xhr.send();
  });
}

const userManagement = {
  getSessionID,
};

export { userManagement };
