// Refresh the XNAT session every minute when the viewer is open.
// TODO -> This needs to be done in a more clever way, like when XNAT updates on
// every page change. However, leaving for a 15 minute meeting causing a nuke of
// your segmentation is pretty bad, as would happen with many XNATs currently if
// we don't regularly refresh the session.
setInterval(function() {
  console.log("request session refresh...");
  getBuildInfo();
}, 60000);

/**
 * getBuildInfo - Queries the buildInfo (only used to maintain a connection open to XNAT).
 *
 * @returns {null}
 */
function getBuildInfo() {
  const xhr = new XMLHttpRequest();

  xhr.open("GET", `${Session.get("rootUrl")}/xapi/siteConfig/buildInfo`);
  xhr.send();
}
