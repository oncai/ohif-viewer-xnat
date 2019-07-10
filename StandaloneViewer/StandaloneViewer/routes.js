import { Meteor } from 'meteor/meteor';
import { Router } from 'meteor/clinical:router';
import { OHIF } from 'meteor/ohif:core';
import { checkAndSetPermissions } from "meteor/icr:xnat-roi";
import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';
import { sessionMap } from 'meteor/icr:series-info-provider';

console.log(Meteor.isDevelopment);

if (Meteor.isClient && !Meteor.isDevelopment) {
  // XNAT deployment mode.
  // Disconnect from the Meteor Server since we don't need it
  OHIF.log.info('Disconnecting from the Meteor server');
  Meteor.disconnect();

  const url = window.location.href;

  const origin = window.location.origin;
  const urlExtention = url.replace(origin, '').split('VIEWER')[0].replace(/\//g, '');

  console.log(urlExtention);

  let viewerRoot;
  let rootUrl;

  if (urlExtention) {
    viewerRoot = `/${urlExtention}/VIEWER`;
    rootUrl = `${origin}/${urlExtention}`;
  } else {
    viewerRoot = `/VIEWER`;
    rootUrl = origin;
  }

  Session.set('rootUrl', rootUrl);
  Session.set('viewerRoot', viewerRoot);

  Router.configure({
      loadingTemplate: 'loading'
  });

  Router.onBeforeAction('loading');

  // JPETTS -- route based on XNAT root
  Router.route(`${viewerRoot}`, {
      onRun: function() {
          console.log('onRun');

          const next = this.next;

          console.log(this.params);

          // Query params:
          //
          // Single Session:
          //   projectId, subjectId, experimentId, experimentLabel
          //
          // Single Session in shared project:
          //   projectId, subjectId, experimentId, experimentLabel, parentProjectId
          //
          // Subject:
          //   projectId, subjectId
          //
          // Subject in shared project:
          //  projectId, subjectId, parentProjectId

          let subjectId;
          let projectId;
          let experimentId;
          let experimentLabel;
          let parentProjectId;

          if (this.params.query) {
            const query = this.params.query;

            experimentId = query.experimentId;
            experimentLabel = query.experimentLabel;
            subjectId = query.subjectId;
            projectId = query.projectId;
            parentProjectId = query.parentProjectId ? query.parentProjectId : projectId;
          } else {
            console.error('insufficient query parameters.');
          }

          if (parentProjectId) {
            console.log(`This experiment is shared view of ${experimentId} from ${parentProjectId}`);
          }

          sessionMap.setProject(projectId);
          sessionMap.setParentProject(parentProjectId);
          sessionMap.setSubject(subjectId);


          if (experimentId) {
            // Single Session
            checkAndSetPermissions(projectId, parentProjectId);

            sessionMap.setSession({
              projectId,
              subjectId,
              experimentId,
              experimentLabel
            });

            // Build JSON GET url.
            const jsonRequestUrl = `${Session.get('rootUrl')}/xapi/viewer/projects/${projectId}/experiments/${experimentId}`;

            getJson(jsonRequestUrl).then(json => {
              // Parse the response content
              // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseText
              if (!json) {
                  OHIF.log.warn('Response was undefined');
                  return;
              }

              sessionMap.setScan(json, {
                experimentId,
                experimentLabel,
                subjectId,
                projectId,
                parentProjectId
              });

              let jsonString = JSON.stringify(json);

              if (parentProjectId) {
                console.log(`replacing ${parentProjectId} with ${projectId}`);
                jsonString = jsonString.replace( new RegExp( parentProjectId, 'g' ), projectId );
              }

              this.data = JSON.parse(jsonString);

              next();
            }).catch(error => {
              console.log(error);
              OHIF.log.warn('An error occurred while retrieving the JSON data');
              next();
            });
          } else {
            // Whole Subject.
            //

            const subjectExperimentListUrl = `${Session.get('rootUrl')}/data/archive/projects/${projectId}/subjects/${subjectId}/experiments?format=json`;

            checkAndSetPermissions(projectId, parentProjectId);

            getJson(subjectExperimentListUrl).then(json => {
              // TODO -> Fetch each json.
              // Promise.all and combine JSON.
              // Load up viewer.
              console.log(json);

              const experimentList = json.ResultSet.Result;
              const results = [];

              for (let i = 0; i < experimentList.length; i++) {
                const experimentIdI = experimentList[i].ID;
                const experimentLabelI = experimentList[i].label;

                sessionMap.setSession({
                  projectId,
                  subjectId,
                  experimentId: experimentIdI,
                  experimentLabel: experimentLabelI
                });

                const experimentJSONFetchUrl = `${Session.get('rootUrl')}/xapi/viewer/projects/${projectId}/experiments/${experimentIdI}`;

                results[i] = getJson(experimentJSONFetchUrl);
              }

              Promise.all(results).then((jsonFiles) => {
                console.log(jsonFiles);

                let studyList = {
                  transactionId: subjectId,
                  studies: []
                };

                for (let i = 0; i < jsonFiles.length; i++) {
                  const experimentJsonI = jsonFiles[i];
                  const studiesI = experimentJsonI.studies;

                  sessionMap.setScan(experimentJsonI, {
                    experimentId: experimentList[i].ID,
                    experimentLabel: experimentList[i].label,
                    subjectId,
                    projectId,
                    parentProjectId
                  });

                  console.log('Session Map:')
                  console.log(sessionMap);

                  // TODO -> clean this
                  studiesI[0].studyDescription = experimentList[i].label || experimentList[i].ID;

                  console.log(`Studies[${i}]`);

                  console.log(studiesI);

                  studyList.studies = [...studyList.studies, ...studiesI];
                }

                console.log(studyList);


                if (parentProjectId) {
                  console.log(`replacing ${parentProjectId} with ${projectId}`);

                  let jsonString = JSON.stringify(studyList);

                  jsonString = jsonString.replace( new RegExp( parentProjectId, 'g' ), projectId );

                  studyList = JSON.parse(jsonString);
                }

                console.log(studyList);

                this.data = studyList;

                console.log(this);
                console.log(this.data);

                next();
              });

            });

          }
      },
      action() {
        console.log('Loading up viewer with json!');
          // Render the Viewer with this data
          this.render('standaloneViewer', {
              data: () => this.data
          });
      }
  });
} else {
    // Local dev mode.
    if (Meteor.isClient) {
      // Disconnect from the Meteor Server since we don't need it
      OHIF.log.info('Disconnecting from the Meteor server');
      Meteor.disconnect();

      Router.configure({
          loadingTemplate: 'loading'
      });

      icrXnatRoiSession.set("writePermissions", true);
      icrXnatRoiSession.set("readPermissions", true);
      icrXnatRoiSession.set("editPermissions", true);

      Router.onBeforeAction('loading');

      Router.route('/:id?', {
          onRun: function() {
              console.warn('onRun');
              // Retrieve the query from the URL the user has entered
              const query = this.params.query;
              const id = this.params.id;

              if (!id && !query.url) {
                  console.log('No URL was specified. Use ?url=${yourURL}');
                  return;
              }

              const next = this.next;
              const idUrl = `/api/${id}`;
              const url = query.url || idUrl;

              // Define a request to the server to retrieve the study data
              // as JSON, given a URL that was in the Route
              const oReq = new XMLHttpRequest();

              // Add event listeners for request failure
              oReq.addEventListener('error', () => {
                  OHIF.log.warn('An error occurred while retrieving the JSON data');
                  next();
              });

              // When the JSON has been returned, parse it into a JavaScript Object
              // and render the OHIF Viewer with this data
              oReq.addEventListener('load', () => {
                  // Parse the response content
                  // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseText
                  if (!oReq.responseText) {
                      OHIF.log.warn('Response was undefined');
                      return;
                  }

                  OHIF.log.info(JSON.stringify(oReq.responseText, null, 2));

                  const parsedJSON = JSON.parse(oReq.responseText);

                  sessionMap.setScan(parsedJSON, {
                    experimentId: 'XNAT_JPETTS_E00014',
                    experimentLabel: 'Patient2',
                    subjectId: 'XNAT_JPETTS_S00011',
                    projectId: 'ITCRdemo',
                    parentProjectId: 'ITCRdemo'
                  });

                  sessionMap.setSession({
                    projectId: 'ITCRdemo',
                    subjectId: 'XNAT_JPETTS_S00011',
                    experimentId: 'XNAT_JPETTS_E00014',
                    experimentLabel: 'Patient2'
                  });

                  sessionMap.setProject('ITCRdemo');
                  sessionMap.setParentProject('ITCRdemo');
                  sessionMap.setSubject('XNAT_JPETTS_S00011');

                  this.data = parsedJSON

                  next();
              });

              // Open the Request to the server for the JSON data
              // In this case we have a server-side route called /api/
              // which responds to GET requests with the study data
              OHIF.log.info(`Sending Request to: ${url}`);
              oReq.open('GET', url);
              oReq.setRequestHeader('Accept', 'application/json')

              // Fire the request to the server
              oReq.send();
          },
          action() {
              // Render the Viewer with this data
              this.render('standaloneViewer', {
                  data: () => this.data
              });
          }
      });
    }

    // This is ONLY for demo purposes.
    if (Meteor.isServer) {
      // You can test this with:
      // curl -v -H "Content-Type: application/json" -X GET 'http://localhost:3000/getData/testId'
      //
      // Or by going to:
      // http://localhost:3000/api/testId

      Router.route('/api/:id', { where: 'server' }).get(function() {
        // "this" is the RouteController instance.
        // "this.response" is the Connect response object
        // "this.request" is the Connect request object
        const id = this.params.id;

        // Find the relevant study data from the Collection given the ID
        const data = RequestStudies.findOne({ transactionId: id });

        // Set the response headers to return JSON to any server
        this.response.setHeader('Content-Type', 'application/json');
        this.response.setHeader('Access-Control-Allow-Origin', '*');
        this.response.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

        // Change the response text depending on the available study data
        if (!data) {
          this.response.write('No Data Found');
        } else {
          // Stringify the JavaScript object to JSON for the response
          this.response.write(JSON.stringify(data));
        }

        // Finalize the response
        this.response.end();
      });
    }
}


function getJson(url) {
  return new Promise((resolve, reject) => {
    // Define a request to the server to retrieve the session data as JSON.
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      console.log(`GET ${url}... ${xhr.status}`);

      resolve(xhr.response);
    };

    xhr.onerror = () => {
      reject(xhr.responseText);
    };

    xhr.open("GET", url);
    xhr.responseType = "json";
    xhr.send();
  });
}
