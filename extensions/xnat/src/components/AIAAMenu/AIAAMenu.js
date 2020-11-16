import React from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import csTools, { getToolState } from 'cornerstone-tools';
import { Icon } from '@ohif/ui';
import AIAAMenuSettings from './AIAAMenuSettings';
import AIAAToolkit from './AIAAToolkit';
import showNotification from '../common/showNotification';
import { AIAA_TOOL_TYPES } from '../../aiaa-tools';

import '../XNATRoiPanel.styl';

const modules = csTools.store.modules;

export default class AIAAMenu extends React.Component {
  static propTypes = {
    studies: PropTypes.any,
    viewports: PropTypes.any,
    activeIndex: PropTypes.any,
    firstImageId: PropTypes.any,
    featureStore: PropTypes.object,
    onUpdateFeatureStore: PropTypes.func,
  }

  static defaultProps = {
    studies: undefined,
    viewports: undefined,
    activeIndex: undefined,
    firstImageId: undefined,
    featureStore: undefined,
    onUpdateFeatureStore: undefined,
  }

  constructor(props = {}) {
    super(props);

    const { settings } = props.featureStore;
    this._aiaaModule = modules.aiaa;
    this._aiaaClient = this._aiaaModule.client;
    this._aiaaClient.api.setServerURL(settings.serverUrl);

    const { viewports, studies, activeIndex } = props;
    this._viewParameters =
      this.getViewParameters(viewports, studies, activeIndex);

    this.state = {
      showSettings: false,
      models: this._aiaaClient.models,
      api: {
        isConnected: this._aiaaClient.isConnected,
        isConnecting: !this._aiaaClient.isConnected,
      },
    };

    this.onToggleShowSettings = this.onToggleShowSettings.bind(this);
    this.onSaveSettings = this.onSaveSettings.bind(this);
    this.onGetModels = this.onGetModels.bind(this);
    this.onToolUpdate = this.onToolUpdate.bind(this);
    this.onRunModel = this.onRunModel.bind(this);
  }

  componentDidMount() {
    const { settings } = this.props.featureStore;
    this._aiaaModule.state.menuIsOpen = true;
    if (!this._aiaaClient.isConnected) {
      this.onGetModels();
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.firstImageId !== prevProps.firstImageId) {
      const { viewports, studies, activeIndex } = props;
      this._viewParameters =
        this.getViewParameters(viewports, studies, activeIndex);
    }
  }

  componentWillUnmount() {
    this._aiaaModule.state.menuIsOpen = false;
  }

  getViewParameters(viewports, studies, activeIndex) {
    const viewport = viewports[activeIndex];
    const { PatientID } = studies[activeIndex];

    const {
      StudyInstanceUID,
      SeriesInstanceUID,
      displaySetInstanceUID,
    } = viewport;

    const element = cornerstone.getEnabledElements()[activeIndex].element;
    const stackToolState = csTools.getToolState(element, 'stack');
    const imageIds = stackToolState.data[0].imageIds;

    // const imageIdsToIndex = new Map();
    // for (let i = 0; i < imageIds.length; i++) {
    //   imageIdsToIndex.set(imageIds[i], i);
    // }

    return {
      PatientID,
      StudyInstanceUID,
      SeriesInstanceUID,
      displaySetInstanceUID,
      imageIds,
      // imageIdsToIndex,
      element,
    };
  }

  onToggleShowSettings = () => {
    this.setState({
      showSettings: !this.state.showSettings,
    });
  }

  onSaveSettings = newSettings => {
    this.onToggleShowSettings();

    const { featureStore, onUpdateFeatureStore } = this.props;
    if(featureStore.settings.serverUrl !== newSettings.serverUrl) {
      this._aiaaClient.api.setServerURL(newSettings.serverUrl);
      this.onGetModels();
    }

    if (!_.isEqual(newSettings, featureStore.settings)) {
      // update feature store
      onUpdateFeatureStore({
        ...featureStore,
        settings: {
          ...featureStore.settings,
          ...newSettings,
        }
      });
    }
  }

  onGetModels = async () => {
    this.setState({
      models: [],
      api: {
        isConnected: false,
        isConnecting: true,
      }
    });

    await this._aiaaClient.getModels();
    this.setState({
      models: this._aiaaClient.models,
      api: {
        isConnected: this._aiaaClient.isConnected,
        isConnecting: false,
      }
    });
  }

  onToolUpdate = async () => {
    console.log(this._aiaaClient.currentTool);
  }

  onRunModel = async () => {
    const parameters = {
      SeriesInstanceUID: this._viewParameters.SeriesInstanceUID,
      imageIds: this._viewParameters.imageIds,
    };
    this._aiaaClient.runModel(parameters);
  }

  render() {
    const { featureStore } = this.props;
    const { settings } = featureStore;
    const { showSettings, api, models } = this.state;

    let statusMessage = null;
    if (api.isConnecting) {
      statusMessage =
        <p>{`Connecting to ${this._aiaaClient.api.getServerURL()} ...`}</p>
    } else if (!api.isConnected) {
      statusMessage =
        <p style={{ color: 'var(--snackbar-error)' }}>
          {`Error connecting to ${this._aiaaClient.api.getServerURL()}`}
        </p>
    }

    return (
      <div className="roiPanelFooter">
        <div className="title-with-icon">
          <h4>NVIDIA AI-Assisted Annotation
            {showSettings &&
            <>
              <span style={{ color: 'var(--active-color)' }}> | </span>
              <span style={{ fontWeight: 'normal' }}>Settings</span>
            </>
            }
          </h4>
          <Icon
            className="settings-icon"
            name={showSettings ? 'xnat-cancel' : 'cog'}
            width="15px"
            height="15px"
            style={{ marginTop: 5, marginLeft: 'auto' }}
            onClick={this.onToggleShowSettings}
          />
          {!showSettings &&
            <Icon
              className="settings-icon"
              name="reset"
              width="15px"
              height="15px"
              style={{ marginTop: 5 }}
              onClick={() => this.onGetModels()}
            />
          }
        </div>
        {showSettings ?
          <AIAAMenuSettings
            settings={settings}
            onSave={this.onSaveSettings}
          /> :
          (statusMessage ?
              <div className="footerSection" style={{ marginBottom: 5 }}>
                <div className="footerSectionItem"
                     style={{ marginBottom: 10, marginTop: 0 }}>
                  {statusMessage}
                </div>
              </div>
              :
              <AIAAToolkit
                models={models}
                onToolUpdate={this.onToolUpdate}
                onRunModel={this.onRunModel}
              />
          )
        }
      </div>
    );
  }
}