/**
 * getBuildInfo - Queries the buildInfo (only used to maintain a connection open to XNAT).
 *
 * @returns {null}
 */
const getBuildInfo = debounce(function() {
  console.log("request session refresh...");

  const xhr = new XMLHttpRequest();

  xhr.open("GET", `${Session.get("rootUrl")}/xapi/siteConfig/buildInfo`);
  xhr.send();
}, 1000);

// Refresh the XNAT session when the  every click/touch, debounced to 1000 ms.
window.addEventListener("mousedown", getBuildInfo);
window.addEventListener("click", getBuildInfo);
window.addEventListener("touchstart", getBuildInfo);
window.addEventListener("focus", getBuildInfo);

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing. Taken from Uncerscore.js
function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this,
      args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}
