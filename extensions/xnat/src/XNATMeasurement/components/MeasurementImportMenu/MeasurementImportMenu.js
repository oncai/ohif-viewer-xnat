import React from 'react';
import PropTypes from 'prop-types';
import sessionMap from '../../../utils/sessionMap';
import { xnatMeasurementApi, dataExchange } from '../../api';
import { Icon } from '@ohif/ui';
import { Loader } from '../../../elements';
import showNotification from '../../../components/common/showNotification';
import fetchJSON from '../../../utils/IO/fetchJSON';
import getReferencedScan from '../../../utils/getReferencedScan';

export default class MeasurementImportMenu extends React.Component {
  static propTypes = {
    onImportComplete: PropTypes.func.isRequired,
    onImportCancel: PropTypes.func.isRequired,
    SeriesInstanceUID: PropTypes.string.isRequired,
    displaySetInstanceUID: PropTypes.string.isRequired,
    seriesCollection: PropTypes.object.isRequired,
  };

  constructor(props = {}) {
    super(props);

    this._cancelablePromises = [];
    this._validTypes = ['MEAS'];

    this._subjectId = sessionMap.getSubject();
    this._projectId = sessionMap.getProject();

    const sessionSelected = sessionMap.getScan(
      props.SeriesInstanceUID,
      'experimentId'
    );

    this._sessions = sessionMap.getSession();
    const sessionCollections = {};
    for (let i = 0; i < this._sessions.length; i++) {
      const experimentId = this._sessions[i].experimentId;
      sessionCollections[experimentId] = {
        experimentLabel: this._sessions[i].experimentLabel,
        importList: [],
        selectAllChecked: false,
        scanSelected: 'All',
      };
    }

    this.state = {
      sessionCollections,
      sessionSelected,
      importListReady: false,
      importing: false,
      progressText: [],
      importProgress: '',
    };

    this.onImportButtonClick = this.onImportButtonClick.bind(this);
    this.onCloseButtonClick = this.onCloseButtonClick.bind(this);
    this.onChangeCheckbox = this.onChangeCheckbox.bind(this);
    this.onReferencedSeriesChange = this.onReferencedSeriesChange.bind(this);
    this.onSessionSelectedChange = this.onSessionSelectedChange.bind(this);
    this.onChangeSelectAllCheckbox = this.onChangeSelectAllCheckbox.bind(this);
    this.updateImportingText = this.updateImportingText.bind(this);
    this.updateProgress = this.updateProgress.bind(this);
  }

  componentDidMount() {
    const { sessionCollections, sessionSelected } = this.state;
    const { SeriesInstanceUID: activeSeriesInstanceUid } = this.props;

    const activeSessionCollection = sessionCollections[sessionSelected];

    const promises = [];

    for (let i = 0; i < this._sessions.length; i++) {
      const experimentId = this._sessions[i].experimentId;

      const cancelablePromise = fetchJSON(
        `data/archive/projects/${this._projectId}/subjects/${this._subjectId}/experiments/${experimentId}/assessors?format=json`
      );
      promises.push(cancelablePromise.promise);
      this._cancelablePromises.push(cancelablePromise);
    }

    Promise.all(promises).then(sessionAssessorLists => {
      const roiCollectionPromises = [];

      for (let i = 0; i < sessionAssessorLists.length; i++) {
        const sessionAssessorList = sessionAssessorLists[i];

        const assessors = sessionAssessorList.ResultSet.Result;

        if (
          !assessors.some(
            assessor => assessor.xsiType === 'icr:roiCollectionData'
          )
        ) {
          continue;
        }

        const experimentId = assessors[0].session_ID;

        for (let i = 0; i < assessors.length; i++) {
          if (assessors[i].xsiType === 'icr:roiCollectionData') {
            const cancelablePromise = fetchJSON(
              `data/archive/projects/${this._projectId}/subjects/${this._subjectId}/experiments/${experimentId}/assessors/${assessors[i].ID}?format=json`
            );

            this._cancelablePromises.push(cancelablePromise);

            roiCollectionPromises.push(cancelablePromise.promise);
          }
        }
      }

      if (!roiCollectionPromises.length) {
        this.setState({ importListReady: true });
        return;
      }

      Promise.all(roiCollectionPromises).then(promisesJSON => {
        promisesJSON.forEach(roiCollectionInfo => {
          if (!roiCollectionInfo) {
            return;
          }

          const data_fields = roiCollectionInfo.items[0].data_fields;

          const referencedScan = getReferencedScan(roiCollectionInfo);
          const referencedDisplaySets = referencedScan.displaySets;
          let referencedSeriesNumber = referencedScan.seriesNumber;
          const collectiveSeriesNotation = [];
          referencedDisplaySets.forEach(
            ds =>
              ds.seriesNotation &&
              collectiveSeriesNotation.push(ds.seriesNotation)
          );
          if (collectiveSeriesNotation.length > 0) {
            // Found multiple display sets in a single scan
            referencedSeriesNumber = `${referencedSeriesNumber}-`;
            collectiveSeriesNotation.forEach(
              n => (referencedSeriesNumber += `${n},`)
            );
            referencedSeriesNumber = referencedSeriesNumber.replace(
              /,\s*$/,
              ''
            );
          }

          if (
            referencedScan &&
            xnatMeasurementApi.isCollectionEligibleForImport(
              roiCollectionInfo,
              referencedScan.seriesInstanceUid
            )
          ) {
            const sessionCollection =
              sessionCollections[data_fields.imageSession_ID];
            sessionCollection.importList.push({
              id: data_fields.ID || data_fields.id,
              selected: false,
              collectionType: data_fields.collectionType,
              label: data_fields.label,
              experimentId: data_fields.imageSession_ID,
              experimentLabel: referencedScan.experimentLabel,
              referencedSeriesInstanceUid: referencedScan.seriesInstanceUid,
              referencedSeriesNumber: referencedSeriesNumber,
              name: data_fields.name,
              date: data_fields.date,
              time: data_fields.time,
              getFilesUri: `data/archive/experiments/${data_fields.imageSession_ID}/assessors/${data_fields.ID}/files?format=json`,
            });
          }
        });

        const collectionInCurrentSession = activeSessionCollection.importList.find(
          element =>
            element.referencedSeriesInstanceUid === activeSeriesInstanceUid
        );
        if (collectionInCurrentSession) {
          activeSessionCollection.scanSelected =
            collectionInCurrentSession.referencedSeriesNumber;
        }

        this.setState({
          sessionCollections,
          importListReady: true,
        });
      });
    });
  }

  componentWillUnmount() {
    const cancelablePromises = this._cancelablePromises;

    for (let i = 0; i < cancelablePromises.length; i++) {
      if (typeof cancelablePromises[i].cancel === 'function') {
        cancelablePromises[i].cancel();
      }
    }
  }

  onChangeCheckbox(evt, id) {
    const checked = evt.target.checked;
    const { sessionCollections, sessionSelected } = this.state;

    const currentCollection = sessionCollections[sessionSelected];
    const importList = currentCollection.importList;

    for (let i = 0; i < importList.length; i++) {
      if (importList[i].id === id) {
        importList[i].selected = checked;
        break;
      }
    }

    this.setState({ sessionCollections });
  }

  onReferencedSeriesChange(evt) {
    const { sessionCollections, sessionSelected } = this.state;
    const currentCollection = sessionCollections[sessionSelected];
    currentCollection.scanSelected = evt.target.value;

    this.setState({ sessionCollections });
  }

  onSessionSelectedChange(evt) {
    this.setState({ sessionSelected: evt.target.value });
  }

  onChangeSelectAllCheckbox(evt) {
    const checked = evt.target.checked;
    const { sessionCollections, sessionSelected } = this.state;

    const currentCollection = sessionCollections[sessionSelected];
    const importList = currentCollection.importList;
    currentCollection.selectAllChecked = checked;
    const scanSelected = currentCollection.scanSelected;

    for (let i = 0; i < importList.length; i++) {
      if (
        scanSelected === 'All' ||
        importList[i].referencedSeriesNumber == scanSelected
      ) {
        importList[i].selected = checked;
      }
    }

    this.setState({ sessionCollections });
  }

  updateImportingText(progressText) {
    this.setState({ progressText });
  }

  updateProgress(status) {
    this.setState({ importProgress: status });
  }

  async onImportButtonClick() {
    const { sessionCollections, sessionSelected } = this.state;

    const currentCollection = sessionCollections[sessionSelected];
    const importList = currentCollection.importList;
    const scanSelected = currentCollection.scanSelected;

    const collectionsToParse = importList.filter(
      collection =>
        collection.selected &&
        (scanSelected === 'All' ||
          collection.referencedSeriesNumber == scanSelected)
    );

    if (collectionsToParse.length === 0) {
      showNotification(
        'Please select one or more collections to import',
        'warning',
        'Measurements Import'
      );
      return;
    }

    this.setState({ importing: true });

    await dataExchange.retrieveMeasurementCollections(collectionsToParse, {
      updateImportingText: this.updateImportingText,
      onImportComplete: this.props.onImportComplete,
      updateProgress: this.updateProgress,
    });
  }

  onCloseButtonClick() {
    this.props.onImportCancel();
  }

  render() {
    const {
      importListReady,
      importing,
      progressText,
      importProgress,
      sessionCollections,
      sessionSelected,
    } = this.state;

    if (importing) {
      return (
        <div className="xnatPanel">
          <div className="panelHeader">
            <h3>Import measurement collections</h3>
          </div>
          <div className="roiCollectionBody limitHeight">
            {progressText[0] && <h4>{progressText[0]}</h4>}
            {progressText[1] && <h4>{progressText[1]}</h4>}
            <h4>{importProgress}</h4>
          </div>
        </div>
      );
    }

    let hasCollections = false;
    for (let key of Object.keys(sessionCollections)) {
      if (sessionCollections[key].importList.length > 0) {
        hasCollections = true;
        break;
      }
    }

    const currentCollection = sessionCollections[sessionSelected];
    const importList = currentCollection.importList;
    const selectAllChecked = currentCollection.selectAllChecked;
    const scanSelected = currentCollection.scanSelected;

    const sessionSelector = (
      <div className="importSessionList">
        <h5>Session</h5>
        <select onChange={this.onSessionSelectedChange} value={sessionSelected}>
          {Object.keys(sessionCollections).map(key => {
            const session = sessionCollections[key];
            return (
              <option
                key={key}
                value={key}
                disabled={session.importList.length === 0}
              >{`${session.experimentLabel}`}</option>
            );
          })}
        </select>
      </div>
    );

    let referencedSeriesNumberList = ['All'];
    importList.forEach(roiCollection => {
      if (
        !referencedSeriesNumberList.includes(
          roiCollection.referencedSeriesNumber
        )
      ) {
        referencedSeriesNumberList.push(roiCollection.referencedSeriesNumber);
      }
    });

    let importBody;

    if (importListReady) {
      if (!hasCollections) {
        importBody = <p>No data to import.</p>;
      } else if (importList.length === 0) {
        importBody = (
          <>
            {sessionSelector}
            <p>Session has no measurement collections.</p>
          </>
        );
      } else {
        importBody = (
          <>
            {sessionSelector}
            <table className="collectionTable" style={{ tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th width="5%" className="centered-cell">
                    <input
                      type="checkbox"
                      className="checkboxInCell"
                      checked={selectAllChecked}
                      value={selectAllChecked}
                      onChange={this.onChangeSelectAllCheckbox}
                    />
                  </th>
                  <th width="45%">Name</th>
                  <th width="20%">Timestamp</th>
                  <th width="30%">
                    Referenced Scan #
                    <select
                      onChange={this.onReferencedSeriesChange}
                      value={scanSelected}
                      style={{ display: 'block', width: '100%' }}
                    >
                      {referencedSeriesNumberList.map(seriesNumber => (
                        <option key={seriesNumber} value={seriesNumber}>
                          {`${seriesNumber}`}
                        </option>
                      ))}
                    </select>
                  </th>
                </tr>
              </thead>
              <tbody>
                {importList
                  .filter(
                    roiCollection =>
                      scanSelected === 'All' ||
                      roiCollection.referencedSeriesNumber == scanSelected
                  )
                  .map(roiCollection => (
                    <tr key={`${roiCollection.id}`}>
                      <td className="centered-cell">
                        <input
                          type="checkbox"
                          className="checkboxInCell"
                          onChange={evt =>
                            this.onChangeCheckbox(evt, roiCollection.id)
                          }
                          checked={roiCollection.selected}
                          value={roiCollection.selected}
                        />
                      </td>
                      <td className="left-aligned-cell">
                        {roiCollection.name}
                      </td>
                      <td>
                        <div>{roiCollection.date}</div>
                        <div>{roiCollection.time}</div>
                      </td>
                      <td className="centered-cell">
                        {`${roiCollection.referencedSeriesNumber}`}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <div className="roiCollectionFooter">
              <button onClick={this.onImportButtonClick}>
                <Icon name="xnat-import" />
                Import selected
              </button>
            </div>
          </>
        );
      }
    } else {
      importBody = (
        <div style={{ textAlign: 'center' }}>
          <Loader />
        </div>
      );
    }

    return (
      <div className="xnatPanel">
        <div className="panelHeader">
          <h3>Import measurement collections</h3>
          <button className="small" onClick={this.onCloseButtonClick}>
            <Icon name="xnat-cancel" />
          </button>
        </div>
        <div className="roiCollectionBody limitHeight">{importBody}</div>
      </div>
    );
  }
}
