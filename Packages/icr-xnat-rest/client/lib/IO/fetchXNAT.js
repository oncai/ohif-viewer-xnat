export default function fetchXNAT(url, responseType, prependHost) {
  return new Promise((resolve, reject) => {
      if (prependHost) {
          url = `${Session.get("rootUrl")}${url}`;
      }

      console.log(`fetching: ${url}`);

      const xhr = new XMLHttpRequest();
      xhr.onload = () => {
        console.log(`Request returned, status: ${xhr.status}`);
        if (xhr.status === 200) {
          resolve(xhr.response);
        } else {
          resolve(null);
        }
      };

      xhr.onerror = () => {
        console.log(`Request returned, status: ${xhr.status}`);
        reject(xhr.responseText);
      };

      xhr.open("GET", url);
      xhr.responseType = responseType;
      xhr.send();
    });
}
