import React, { Component } from 'react';
import { log, metadata, utils } from '@ohif/core';
import PropTypes from 'prop-types';
import qs from 'querystring';

import { extensionManager, commandsManager } from './../App.js';
import ConnectedViewer from '../connectedComponents/ConnectedViewer';
import ConnectedViewerRetrieveStudyData from '../connectedComponents/ConnectedViewerRetrieveStudyData';
import NotFound from '../routes/NotFound';

const { studyMetadataManager, updateMetaDataManager } = utils;
const { OHIFStudyMetadata } = metadata;

class XNATStandaloneRouting extends Component {
  state = {
    studies: null,
    server: null,
    studyInstanceUids: null,
    seriesInstanceUids: null,
    error: null,
    loading: true,
  };

  static propTypes = {
    location: PropTypes.object,
    store: PropTypes.object,
    setServers: PropTypes.func,
  };

  parseQueryAndRetrieveDICOMWebData(query) {
    return new Promise((resolve, reject) => {
      console.warn('XNAT STANDALONE ROUTING');

      const { projectId, subjectId, experimentId, experimentLabel } = query;

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

      let rootPlusPort = window.location.origin;

      if (window.port) {
        rootPlusPort += `:${window.port}`;
      }

      const pathLessViewer = window.location.pathname.split('VIEWER')[0];

      rootPlusPort += pathLessViewer;

      console.log(rootPlusPort);

      commandsManager.runCommand('xnatSetRootUrl', {
        url: rootPlusPort,
      });

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

        const jsonRequestUrl = `${rootPlusPort}xapi/viewer/projects/${projectId}/experiments/${experimentId}`;

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

          resolve({ studies: data.studies, studyInstanceUids: [] });
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

        const subjectExperimentListUrl = `${rootPlusPort}data/archive/projects/${projectId}/subjects/${subjectId}/experiments?format=json`;

        console.log(subjectExperimentListUrl);

        _getJson(subjectExperimentListUrl).then(json => {
          // TODO -> Fetch each json.
          // Promise.all and combine JSON.
          // Load up viewer.
          console.log(json);

          const experimentList = json.ResultSet.Result;
          const results = [];

          for (let i = 0; i < experimentList.length; i++) {
            const experimentIdI = experimentList[i].ID;
            const experimentJSONFetchUrl = `${rootPlusPort}xapi/viewer/projects/${projectId}/experiments/${experimentIdI}`;

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
              studiesI[0].studyDescription =
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

            resolve({ studies: studyList.studies, studyInstanceUids: [] });
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

      let {
        server,
        studies,
        studyInstanceUids,
        seriesInstanceUids,
      } = await this.parseQueryAndRetrieveDICOMWebData(query);

      if (studies) {
        const {
          studies: updatedStudies,
          studyInstanceUids: updatedStudiesInstanceUids,
        } = _mapStudiesToNewFormat(studies);
        studies = updatedStudies;
        studyInstanceUids = updatedStudiesInstanceUids;
      }

      this.setState({
        studies,
        server,
        studyInstanceUids,
        seriesInstanceUids,
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
      <ConnectedViewer studies={this.state.studies} />
    ) : (
      <ConnectedViewerRetrieveStudyData
        studyInstanceUids={this.state.studyInstanceUids}
        seriesInstanceUids={this.state.seriesInstanceUids}
        server={this.state.server}
      />
    );
  }
}

const _mapStudiesToNewFormat = studies => {
  studyMetadataManager.purge();

  /* Map studies to new format, update metadata manager? */
  const uniqueStudyUids = new Set();
  const updatedStudies = studies.map(study => {
    const studyMetadata = new OHIFStudyMetadata(study, study.studyInstanceUid);

    const sopClassHandlerModules =
      extensionManager.modules['sopClassHandlerModule'];
    study.displaySets =
      study.displaySets ||
      studyMetadata.createDisplaySets(sopClassHandlerModules);
    studyMetadata.setDisplaySets(study.displaySets);

    /* Updates WADO-RS metaDataManager */
    updateMetaDataManager(study);

    studyMetadataManager.add(studyMetadata);
    uniqueStudyUids.add(study.studyInstanceUid);

    return study;
  });

  return {
    studies: updatedStudies,
    studyInstanceUids: Array.from(uniqueStudyUids),
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
