import React, { Component } from 'react';
import OHIF from '@ohif/core';
import PropTypes from 'prop-types';
import qs from 'querystring';

import { extensionManager, commandsManager } from './../App.js';
import ConnectedViewer from '../connectedComponents/ConnectedViewer';
import ConnectedViewerRetrieveStudyData from '../connectedComponents/ConnectedViewerRetrieveStudyData';
import NotFound from '../routes/NotFound';

import { isLoggedIn, xnatAuthenticate } from '@xnat-ohif/extension-xnat';

const { log, metadata, utils } = OHIF;
const { studyMetadataManager } = utils;
const { OHIFStudyMetadata } = metadata;

class XNATStandaloneRouting extends Component {
  state = {
    studies: null,
    server: null,
    studyInstanceUIDs: null,
    seriesInstanceUIDs: null,
    error: null,
    loading: true,
  };

  static propTypes = {
    location: PropTypes.object,
    store: PropTypes.object,
    setServers: PropTypes.func,
  };

  parseQueryAndRetrieveDICOMWebData(rootUrl, query) {
    return new Promise((resolve, reject) => {
      const { projectId, subjectId, experimentId, experimentLabel } = query;

      commandsManager.runCommand('xnatSetRootUrl', {
        url: rootUrl,
      });

      // Query AIAA settings
      commandsManager.runCommand('xnatCheckAndSetAiaaSettings', {
        projectId: projectId,
      });

      // Query user information
      getUserInformation(rootUrl);

      if (!projectId || !subjectId) {
        //return reject(new Error('No URL was specified. Use ?url=$yourURL'));
        return reject(
          new Error(
            'Not enough data specified, Use VIEWERS/?url=projectId&subjectId'
          )
        );
      }

      const parentProjectId = query.parentProjectId
        ? query.parentProjectId
        : projectId;

      if (parentProjectId) {
        console.warn(
          `This experiment is shared view of ${experimentId} from ${parentProjectId}`
        );
      }

      commandsManager.runCommand('xnatCheckAndSetPermissions', {
        projectId,
        parentProjectId,
        subjectId,
      });

      // TODO -> Session Map in the XNAT extension.

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

      if (experimentId) {
        commandsManager.runCommand('xnatSetView', {
          view: 'session',
        });

        const jsonRequestUrl = `${rootUrl}xapi/viewer/projects/${projectId}/experiments/${experimentId}`;

        console.log(jsonRequestUrl);

        // Define a request to the server to retrieve the study data
        // as JSON, given a URL that was in the Route
        const oReq = new XMLHttpRequest();

        // Add event listeners for request failure
        oReq.addEventListener('error', error => {
          log.warn('An error occurred while retrieving the JSON data');
          reject(error);
        });

        // When the JSON has been returned, parse it into a JavaScript Object
        // and render the OHIF Viewer with this data
        oReq.addEventListener('load', event => {
          if (event.target.status === 404) {
            reject(new Error('No JSON data found'));
          }

          // Parse the response content
          // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseText
          if (!oReq.responseText) {
            log.warn('Response was undefined');
            reject(new Error('Response was undefined'));
          }

          let jsonString = oReq.responseText;

          if (parentProjectId) {
            console.warn(
              `replacing ${parentProjectId} with ${projectId} so resources can be fetched`
            );
            jsonString = jsonString.replace(
              new RegExp(parentProjectId, 'g'),
              projectId
            );
          }

          log.info(JSON.stringify(jsonString, null, 2));

          const data = JSON.parse(jsonString);

          commandsManager.runCommand('xnatSetSession', {
            json: data,
            sessionVariables: {
              experimentId,
              experimentLabel,
              subjectId,
              projectId,
              parentProjectId,
            },
          });

          console.warn(data);

          resolve({ studies: data.studies, studyInstanceUIDs: [] });
        });

        // Open the Request to the server for the JSON data
        // In this case we have a server-side route called /api/
        // which responds to GET requests with the study data
        log.info(`Sending Request to: ${jsonRequestUrl}`);
        oReq.open('GET', jsonRequestUrl);
        oReq.setRequestHeader('Accept', 'application/json');

        // Fire the request to the server
        oReq.send();
      } else {
        // Subject view
        commandsManager.runCommand('xnatSetView', {
          view: 'subject',
        });

        const subjectExperimentListUrl = `${rootUrl}data/archive/projects/${projectId}/subjects/${subjectId}/experiments?format=json`;

        console.log(subjectExperimentListUrl);

        _getJson(subjectExperimentListUrl).then(json => {
          // TODO -> Fetch each json.
          // Promise.all and combine JSON.
          // Load up viewer.
          console.log(json);

          if (!json || !json.ResultSet || !json.ResultSet.Result) {
            return reject(new Error('Data cannot be accessed'));
          }

          const experimentList = json.ResultSet.Result;
          const results = [];

          for (let i = 0; i < experimentList.length; i++) {
            const experimentIdI = experimentList[i].ID;
            const experimentJSONFetchUrl = `${rootUrl}xapi/viewer/projects/${projectId}/experiments/${experimentIdI}`;

            results[i] = _getJson(experimentJSONFetchUrl);
          }

          Promise.all(results).then(jsonFiles => {
            console.log(jsonFiles);

            let studyList = {
              transactionId: subjectId,
              studies: [],
            };

            for (let i = 0; i < jsonFiles.length; i++) {
              const experimentJsonI = jsonFiles[i];
              const studiesI = experimentJsonI.studies;

              commandsManager.runCommand('xnatSetSession', {
                json: experimentJsonI,
                sessionVariables: {
                  experimentId: experimentList[i].ID,
                  experimentLabel: experimentList[i].label,
                  subjectId,
                  projectId,
                  parentProjectId,
                },
              });

              // TODO -> clean this
              studiesI[0].StudyDescription =
                experimentList[i].label || experimentList[i].ID;

              console.log(`Studies[${i}]`);

              console.log(studiesI);

              studyList.studies = [...studyList.studies, ...studiesI];
            }

            console.log(studyList);

            if (parentProjectId) {
              console.log(`replacing ${parentProjectId} with ${projectId}`);

              let jsonString = JSON.stringify(studyList);

              jsonString = jsonString.replace(
                new RegExp(parentProjectId, 'g'),
                projectId
              );

              studyList = JSON.parse(jsonString);
            }

            console.log(studyList);

            resolve({ studies: studyList.studies, studyInstanceUIDs: [] });
          });
        });
      }
    });
  }

  async componentDidMount() {
    try {
      let { search } = this.props.location;

      // Remove ? prefix which is included for some reason
      search = search.slice(1, search.length);
      const query = qs.parse(search);

      let rootUrl = getRootUrl();

      if (process.env.NODE_ENV === 'development') {
        console.info('XNATStandaloneRouting Development mode! .........');
        rootUrl = process.env.XNAT_PROXY;
        // Authenticate to XNAT
        const loggedIn = await isLoggedIn();
        console.info('Logged in XNAT? ' + loggedIn);
        if (!loggedIn) {
          await xnatAuthenticate();
        }
      }

      console.log(`rootUrl: ${rootUrl}`);

      let {
        server,
        studies,
        studyInstanceUIDs,
        seriesInstanceUIDs,
      } = await this.parseQueryAndRetrieveDICOMWebData(rootUrl, query);

      if (studies) {
        // Set document title
        let documentTitle = studies[0].PatientID || studies[0].PatientName;
        documentTitle = documentTitle
          ? `${documentTitle} | XNAT OHIF Viewer`
          : 'XNAT OHIF Viewer';
        document.title = documentTitle;

        // Remove series with no instances
        studies = studies.filter(study => {
          study.series = study.series.filter(series => {
            return series.instances.length > 0;
          });
          return study.series !== undefined;
        });

        // Reassign instance URLs
        reassignInstanceUrls(studies, rootUrl);

        // Parse data here and add to metadata provider
        await updateMetaDataProvider(studies);

        const {
          studies: updatedStudies,
          studyInstanceUIDs: updatedStudiesInstanceUIDs,
        } = _mapStudiesToNewFormat(studies);
        studies = updatedStudies;
        studyInstanceUIDs = updatedStudiesInstanceUIDs;
      }

      this.setState({
        studies,
        server,
        studyInstanceUIDs,
        seriesInstanceUIDs,
        loading: false,
      });
    } catch (error) {
      this.setState({ error: error.message, loading: false });
    }
  }

  render() {
    const message = this.state.error
      ? `Error: ${JSON.stringify(this.state.error)}`
      : 'Loading...';
    if (this.state.error || this.state.loading) {
      return <NotFound message={message} showGoBackButton={this.state.error} />;
    }

    return this.state.studies ? (
      <ConnectedViewer
        studies={this.state.studies}
        studyInstanceUIDs={this.state.studyInstanceUIDs}
        seriesInstanceUIDs={this.state.seriesInstanceUIDs}
      />
    ) : (
      <ConnectedViewerRetrieveStudyData
        studyInstanceUIDs={this.state.studyInstanceUIDs}
        seriesInstanceUIDs={this.state.seriesInstanceUIDs}
        server={this.state.server}
      />
    );
  }
}

const _mapStudiesToNewFormat = studies => {
  studyMetadataManager.purge();

  /* Map studies to new format, update metadata manager? */
  const uniqueStudyUIDs = new Set();
  const updatedStudies = studies.map(study => {
    const studyMetadata = new OHIFStudyMetadata(study, study.StudyInstanceUID);

    const sopClassHandlerModules =
      extensionManager.modules['sopClassHandlerModule'];
    study.displaySets =
      study.displaySets ||
      studyMetadata.createDisplaySets(sopClassHandlerModules);

    studyMetadataManager.add(studyMetadata);
    uniqueStudyUIDs.add(study.StudyInstanceUID);

    return study;
  });

  setValidOverlaySeries(updatedStudies);

  return {
    studies: updatedStudies,
    studyInstanceUIDs: Array.from(uniqueStudyUIDs),
  };
};

export default XNATStandaloneRouting;

function _getJson(url) {
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

    xhr.open('GET', url);
    xhr.responseType = 'json';
    xhr.send();
  });
}

async function getUserInformation(rootUrl) {
  const userInfo = {
    loginName: '',
    name: '',
  };
  window.ohif.userInfo = userInfo;

  const promise = new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      resolve(xhr);
    };
    xhr.onerror = () => {
      reject(xhr.responseText);
    };
    xhr.open('GET', `${rootUrl}xapi/users/username`);
    xhr.responseType = 'text';
    xhr.send();
  });

  promise
    .then(result => {
      const { response } = result;
      userInfo.loginName = response;

      return _getJson(`${rootUrl}xapi/users/profile/${response}`);
    })
    .then(result => {
      const { firstName, lastName } = result;
      if (firstName && lastName) {
        userInfo.name = `${lastName}, ${firstName}`;
      }
    })
    .catch(error => {
      console.warn('Could not retrieve user information from XNAT');
    });
}

function getRootUrl() {
  let rootPlusPort = window.location.origin;

  const pathLessViewer = window.location.pathname.split('VIEWER')[0];

  rootPlusPort += pathLessViewer;

  return rootPlusPort;
}

function reassignInstanceUrls(studies, rootUrl) {
  const archiveUrl = '/data/archive/';
  // remove protocol
  let xnatRoot = rootUrl.replace(/(^\w+:|^)\/\//, '').replace(/\/$/, '');
  let dicomweb = 'dicomweb://';
  if (process.env.NODE_ENV === 'development') {
    dicomweb = 'dicomweb:';
  }

  studies.forEach(study => {
    study.series.forEach(series => {
      series.instances.forEach(instance => {
        let relUrl = instance.url;
        if (relUrl.startsWith('dicomweb')) {
          // Strip to relative URL
          const idx = relUrl.indexOf(archiveUrl);
          relUrl = relUrl.substring(idx);
        }
        instance.url = `${dicomweb}${xnatRoot}${relUrl}`;
      });
    });
  });
}

async function updateMetaDataProvider(studies) {
  const metadataProvider = OHIF.cornerstone.metadataProvider;
  let StudyInstanceUID;
  let SeriesInstanceUID;

  for (let study of studies) {
    StudyInstanceUID = study.StudyInstanceUID;
    for (let series of study.series) {
      SeriesInstanceUID = series.SeriesInstanceUID;
      await Promise.all(
        series.instances.map(async instance => {
          const { url: imageId, metadata: naturalizedDicom } = instance;
          naturalizedDicom.PatientID = study.PatientID;
          naturalizedDicom.PatientName = { Alphabetic: study.PatientName };
          // naturalizedDicom.StudyDescription = study.StudyDescription;
          naturalizedDicom.SeriesNumber = series.SeriesNumber;
          naturalizedDicom.SeriesDescription = series.SeriesDescription;
          if (!naturalizedDicom.PlanarConfiguration) {
            naturalizedDicom.PlanarConfiguration = 0;
          }
          // PaletteColorLookupTableData is loaded conditionally in metadataProvider.addInstance
          // OverlayData is loaded conditionally in metadataProvider.addInstance

          // Add instance to metadata provider.
          await metadataProvider.addInstance(naturalizedDicom, { imageId });

          // Add imageId specific mapping to this data as the URL isn't necessarily WADO-URI.
          // I.e. here the imageId is added w/o frame number for multi-frame images
          // Also added in StackManager => createAndAddStack for WADO-URI
          metadataProvider.addImageIdToUIDs(imageId, {
            StudyInstanceUID,
            SeriesInstanceUID,
            SOPInstanceUID: naturalizedDicom.SOPInstanceUID,
          });
        })
      );
    }
  }
}

function setValidOverlaySeries(studies) {
  const backgroundModalities = ['MR', 'CT'];
  const overlayModalities = ['PT', 'NM'];
  studies.forEach((study, studyIndex, studies) => {
    study.displaySets.forEach((displaySet, displaySetIndex, displaySets) => {
      displaySet.validOverlayDisplaySets = {};
      if (backgroundModalities.includes(displaySet.Modality)) {
        // Add series within this study
        // ToDo: use reliable checks (IOP & IPP)
        const sameStudyOverlays = [];
        for (let i = 0; i < displaySets.length; i++) {
          if (i !== displaySetIndex) {
            if (overlayModalities.includes(displaySets[i].Modality)) {
              sameStudyOverlays.push(displaySets[i].displaySetInstanceUID);
            }
          }
        }
        if (sameStudyOverlays.length) {
          // Handle duplicate StudyInstanceUID by adding study index
          displaySet.validOverlayDisplaySets[
            `${displaySet.StudyInstanceUID}_${studyIndex}`
          ] = sameStudyOverlays;
        }

        // Use FrameOfReferenceUID to match in other studies
        for (let i = 0; i < studies.length; i++) {
          if (i !== studyIndex) {
            const otherStudyOverlays = [];
            studies[i].displaySets.forEach(ds => {
              if (
                displaySet.FrameOfReferenceUID === ds.FrameOfReferenceUID &&
                overlayModalities.includes(ds.Modality)
              ) {
                otherStudyOverlays.push(ds.displaySetInstanceUID);
              }
            });
            if (otherStudyOverlays.length) {
              displaySet.validOverlayDisplaySets[
                `${studies[i].StudyInstanceUID}_${i}`
              ] = otherStudyOverlays;
            }
          }
        }
      }
    });
  });
}
