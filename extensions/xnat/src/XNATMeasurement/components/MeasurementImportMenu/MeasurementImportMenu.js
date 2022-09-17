import React from 'react';
import PropTypes from 'prop-types';
import sessionMap from '../../../utils/sessionMap';
import { xnatMeasurementApi, dataExchange } from '../../api';
import OHIF from '@ohif/core';
import { Icon } from '@ohif/ui';
import { Loader } from '../../../elements';
import showNotification from '../../../components/common/showNotification';

const { studyMetadataManager } = OHIF.utils;

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
  }

  componentDidMount() {
    this.setState({
      importListReady: true,
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

  async onImportButtonClick() {
    try {
      const collectionObject = await dataExchange.retrieveMeasurementCollection();
      const displaySetInstanceUID = this.getDisplaySetInstanceUID(
        collectionObject.imageReference.SeriesInstanceUID
      );
      xnatMeasurementApi.addImportedCollection(
        displaySetInstanceUID,
        collectionObject
      );
      this.props.onImportComplete();
    } catch (error) {
      console.error(error);

      const message = error.message || 'Unknown error';
      showNotification(
        message,
        'error',
        'Error importing measurement collection'
      );
    }
  }

  getDisplaySetInstanceUID(SeriesInstanceUID) {
    let displaySetInstanceUID = undefined;
    const studies = studyMetadataManager.all();
    for (let i = 0; i < studies.length; i++) {
      const study = studies[i];
      const displaySets = study.getDisplaySets();

      for (let j = 0; j < displaySets.length; j++) {
        const displaySet = displaySets[j];

        if (displaySet.SeriesInstanceUID === SeriesInstanceUID) {
          displaySetInstanceUID = displaySet.displaySetInstanceUID;
          break;
        }
      }

      if (displaySetInstanceUID) {
        break;
      }
    }

    return displaySetInstanceUID;
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
        <select
          // onChange={this.onSessionSelectedChange}
          value={sessionSelected}
        >
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
        importBody = (
          <>
            <p>No data to import.</p>
            <button onClick={this.onImportButtonClick}>
              <Icon name="xnat-import" />
              Import selected
            </button>
          </>
        );
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
                      // onChange={this.onChangeSelectAllCheckbox}
                    />
                  </th>
                  <th width="45%">Name</th>
                  <th width="20%">Timestamp</th>
                  <th width="30%">
                    Referenced Scan #
                    <select
                      // onChange={this.onReferencedSeriesChange}
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
                          // onChange={evt =>
                          //   this.onChangeCheckbox(evt, roiCollection.id)
                          // }
                          checked={roiCollection.selected}
                          value={roiCollection.selected}
                        />
                      </td>
                      <td className="left-aligned-cell">
                        {roiCollection.name}
                      </td>
                      <td>{`${roiCollection.date} ${roiCollection.time}`}</td>
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
