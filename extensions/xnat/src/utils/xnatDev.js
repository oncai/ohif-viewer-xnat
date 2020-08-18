/*
XNAT authentication
 */
function _isLoggedIn() {
  const url = window.config.xnat_dev.url + 'data/JSESSION?CSRF=true';

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      console.log(`GET ${url}... ${xhr.status}`);

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
    xhr.ontimeout = 5000;
    xhr.send();
  });
}

function _getSessionID() {
  let value = '';
  if (document.cookie !== '') {
    value = document.cookie
      .split('; ')
      .find(row => row.startsWith('XNAT_JSESSIONID'));
    if (value) {
      value = value.split('=')[1];
    }
  }
  return value;
}

function _getCsrfToken() {
  let value = '';
  if (document.cookie !== '') {
    value = document.cookie
      .split('; ')
      .find(row => row.startsWith('XNAT_CSRF'));
    if (value) {
      value = value.split('=')[1];
    }
  }
  return value;
}

export async function isLoggedIn() {
  const sessionID = _getSessionID();
  let loggedIn = false;
  try {
    let res = await _isLoggedIn();
    res = res.split(';');
    const csrfToken = res.length > 1 ? res[1].trim().split('=')[1] : '';
    document.cookie = `XNAT_CSRF=${csrfToken}`;
    if (sessionID === res[0]) {
      loggedIn = true;
    } else {
      console.warn('Not logged-in XNAT: ' + res);
    }
  } catch (err) {
    console.error(err);
  }
  return loggedIn;
}

function _xnatAuthenticate(csrfToken) {
  const csrfTokenParameter = `XNAT_CSRF=${csrfToken}`;
  const url = window.config.xnat_dev.url + `data/JSESSION?${csrfTokenParameter}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      console.log(`POST ${url}... ${xhr.status}`);

      if (xhr.status === 200) {
        resolve(xhr.response);
      } else {
        reject('Error authenticating to XNAT');
      }
    };

    xhr.onerror = () => {
      reject('Error authenticating to XNAT' + xhr.responseText);
    };

    xhr.open('POST', url);
    // xhr.withCredentials = true;
    xhr.setRequestHeader(
      'Authorization',
      'Basic ' +
        btoa(
          `${window.config.xnat_dev.username}:${window.config.xnat_dev.password}`
        )
    );
    xhr.ontimeout = 5000;
    xhr.send();
  });
}

export async function xnatAuthenticate() {
  const csrfToken = _getCsrfToken();

  try {
    let res = await _xnatAuthenticate(csrfToken);
    document.cookie = `XNAT_JSESSIONID=${res}`;
    console.warn('Logged-in to XNAT: ' + res);
  } catch (err) {
    console.error(err);
  }
}

export function reassignInstanceUrls(studies) {
  const PROXY_TARGET = window.config.xnat_dev.url;
  const PROXY_DOMAIN = window.config.xnat_dev.domain;

  studies.forEach(study => {
    study.series.forEach(series => {
      series.instances.forEach(instance => {
        instance.url = instance.url.replace(PROXY_DOMAIN, PROXY_TARGET);
        // instance.url = instance.url.replace('dicomweb', 'wadouri');
        // console.log(instance.url);
      });
    });
  });
}
