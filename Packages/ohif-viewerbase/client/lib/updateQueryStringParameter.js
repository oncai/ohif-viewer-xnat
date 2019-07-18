// https://stackoverflow.com/a/6021027/3895126
//
// XNAT_DIFF: refactored out of getImageId.js
export default function updateQueryStringParameter(uri, key, value) {
  const regex = new RegExp("([?&])" + key + "=.*?(&|$)", "i");

  const separator = uri.indexOf("?") !== -1 ? "&" : "?";

  if (uri.match(regex)) {
    return uri.replace(regex, "$1" + key + "=" + value + "$2");
  } else {
    return uri + separator + key + "=" + value;
  }
}
