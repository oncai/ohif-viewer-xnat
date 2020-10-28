import React from 'react';
import PropTypes from 'prop-types';
import csTools from 'cornerstone-tools';
import { Icon } from '@ohif/ui';
import { AIAAClient } from '../../aiaa-tools';
import AIAAMenuSettings from './AIAAMenuSettings';
import AIAAToolkit from './AIAAToolkit';
import showNotification from '../common/showNotification';

import '../XNATRoiPanel.styl';

const modules = csTools.store.modules;

export default class AIAAMenu extends React.Component {
  static propTypes = {
    studies: PropTypes.any,
    viewports: PropTypes.any,
    activeIndex: PropTypes.any,
    featureStore: PropTypes.object,
    onUpdateFeatureStore: PropTypes.func,
  }

  static defaultProps = {
    studies: undefined,
    viewports: undefined,
    activeIndex: undefined,
    featureStore: undefined,
    onUpdateFeatureStore: undefined,
  }

  constructor(props = {}) {
    super(props);

    this.state = {
      showSettings: false,
      models: [],
      api: {
        isConnected: false,
        isConnecting: true,
      },
    };

    const { settings } = props.featureStore;
    this._aiaaClient = new AIAAClient(settings.serverUrl);

    this.onToggleShowSettings = this.onToggleShowSettings.bind(this);
    this.onSaveSettings = this.onSaveSettings.bind(this);
    this.onGetModels = this.onGetModels.bind(this);
  }

  componentDidMount() {
    const { settings } = this.props.featureStore;
    const aiaaModule = modules.aiaa;
    aiaaModule.state.menuIsOpen = true;
    aiaaModule.api.client = this._aiaaClient;
    this.onGetModels(settings.serverUrl);
  }

  componentWillUnmount() {
    const aiaaModule = modules.aiaa;
    aiaaModule.state.menuIsOpen = false;
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
      this.onGetModels(newSettings.serverUrl);
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

  onGetModels = async (serverUrl) => {
    this.setState({
      models: [],
      api: {
        isConnected: false,
        isConnecting: true,
      }
    });

    const aiaaModule = modules.aiaa;
    aiaaModule.api.client.setServerURL(serverUrl);
    let response = await aiaaModule.api.client.getModels();
    if (response.status !== 200) {
      showNotification(
        `Failed to fetch models! Reason: ${response.data}`,
        'error',
        'NVIDIA AIAA'
      );

      this.setState({
        api: {
          isConnected: false,
          isConnecting: false,
        }
      });

      return;
    }

    // showNotification(
    //   'Fetched available models',
    //   'success',
    //   'NVIDIA AIAA'
    // );

    this.setState({
      models: response.data,
      api: {
        isConnected: true,
        isConnecting: false,
      }
    });
  }

  render() {
    const { featureStore } = this.props;
    const { settings } = featureStore;
    const { showSettings, api, models } = this.state;

    let statusMessage = null;
    if (api.isConnecting) {
      statusMessage =
        <p>{`Connecting to ${this._aiaaClient.getServerURL()} ...`}</p>
    } else if (!api.isConnected) {
      statusMessage =
        <p style={{ color: 'var(--snackbar-error)' }}>
          {`Error connecting to ${this._aiaaClient.getServerURL()}`}
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
              onClick={() => this.onGetModels(settings.serverUrl)}
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
              />
          )
        }
      </div>
    );
  }
}