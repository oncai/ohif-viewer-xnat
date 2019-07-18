import { icrXnatRoiSession } from "meteor/icr:xnat-roi-namespace";

/**
 * checkAndSetPermissions - Queries the XNAT-ROI XAPI for the permissions the
 * user has for the roiCollection schema element, and stores the result in
 * Session variables.
 *
 * @param  {type} projectId       The XNAT projectId.
 * @param  {type} parentProjectId The ID of the parent project. If the session
 *                                is not shared into another project, it will
 *                                be the same as the projectId.
 * @returns {null}
 */
export async function checkAndSetPermissions(projectId, parentProjectId) {
  const url = `${Session.get(
    "rootUrl"
  )}/xapi/roi/projects/${parentProjectId}/permissions/RoiCollection`;

  icrXnatRoiSession.set("writePermissions", true);
  icrXnatRoiSession.set("readPermissions", true);
  icrXnatRoiSession.set("editPermissions", true);

  getPermissionsJson(url)
    .then(result => {
      const { status, response } = result;

      if (status === 200) {
        console.log(
          `permissions: create: ${response.create},
          read: ${response.read},
          edit: ${response.edit}`
        );

        icrXnatRoiSession.set("writePermissions", response.create);
        icrXnatRoiSession.set("readPermissions", response.read);
        icrXnatRoiSession.set("editPermissions", response.edit);
      } else if (parentProjectId !== projectId) {
        // Assume read only of parent  project.
        console.log("Can only read from parent project");
        icrXnatRoiSession.set("writePermissions", false);
        icrXnatRoiSession.set("readPermissions", true);
        icrXnatRoiSession.set("editPermissions", false);
      }
    })
    .catch(err => {
      console.log(err);

      icrXnatRoiSession.set("writePermissions", false);
      icrXnatRoiSession.set("readPermissions", false);
      icrXnatRoiSession.set("editPermissions", false);
    });
}

/**
 * Queries the XNAT REST API for write permissions to the roiCollection schema
 * element.
 *
 * @param {string} url - The REST call to be made.
 * @returns {object} A parsed JSON representation of the permissions.
 */
function getPermissionsJson(url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      resolve(xhr);
    };

    xhr.onerror = () => {
      reject(xhr.responseText);
    };

    xhr.open("GET", url);
    xhr.responseType = "json";
    xhr.send();
  });
}
