import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { isEqual } from 'lodash';
import { useSelector, useDispatch } from 'react-redux';
import { redux } from '@ohif/core';
import csTools from 'cornerstone-tools';
import { Icon } from '@ohif/ui';
import showNotification from '../common/showNotification.js';
import AIAAMenuSettings from './AIAAMenuSettings.js';

import '../XNATRoiPanel.styl';

const { actions } = redux;

function AIAAMenu({studies, viewports, activeIndex}) {
  const dispatch = useDispatch();

  const { experimentalFeatures, featureKey } = useSelector(state => {
    const { preferences = {} } = state;
    const { experimentalFeatures = {} } = preferences;

    const featureKey = Object.keys(experimentalFeatures).filter(key => {
      return experimentalFeatures[key].id === 'NVIDIAClaraAIAA';
    })[0];

    return { experimentalFeatures, featureKey };
  });

  const [state, setState] = useState({
    showSettings: false,
    updateStore: false,
    api: {
      connected: false,
      success: true,
      reconnect: false,
    },
    experimentalFeatures: { ...experimentalFeatures },
  });

  const featureStore = state.experimentalFeatures[featureKey];

  useEffect(() => {
    if (state.updateStore) {
      dispatch(actions.setUserPreferences({
        experimentalFeatures: {
          ...experimentalFeatures,
          [featureKey]: {
            ...featureStore,
          }
        }
      }));
    }
  }, [state.updateStore]);

  const onToggleShowSettings = () => {
    setState(prevState => ({
      ...prevState,
      showSettings: !state.showSettings,
    }));
  };

  const onSaveSettings = newSettings => {
    const connectToServer = featureStore.settings.serverUrl !==
      newSettings.serverUrl;

    const updateStore = !_.isEqual(newSettings, featureStore.settings);

    setState(prevState => ({
      ...prevState,
      showSettings: !state.showSettings,
      updateStore: updateStore,
      experimentalFeatures: {
        ...prevState.experimentalFeatures,
        [featureKey]: {
          ...featureStore,
          settings: {
            ...newSettings,
          },
        },
      },
    }));
  };

  return (
    <div className="roiPanelFooter">
      <div className="title-with-icon">
        <h4>NVIDIA AI-Assisted Annotation
          {state.showSettings &&
          <>
            <span style={{ color: 'var(--active-color)' }}> | </span>
            <span style={{ fontWeight: 'normal' }}>Settings</span>
          </>
          }
        </h4>
        <Icon
          className="settings-icon"
          name={state.showSettings ? 'xnat-cancel' : 'cog'}
          width="15px"
          height="15px"
          style={{ marginTop: 5 }}
          onClick={onToggleShowSettings}
        />
      </div>
      {state.showSettings &&
        <AIAAMenuSettings
          settings={featureStore.settings}
          onSave={onSaveSettings}
        />
      }
    </div>
  );
}

AIAAMenu.propTypes = {
  studies: PropTypes.any,
  viewports: PropTypes.any,
  activeIndex: PropTypes.any,
};

AIAAMenu.defaultProps = {
  studies: undefined,
  viewports: undefined,
  activeIndex: undefined,
};

export default AIAAMenu;

/*
export default class AIAAMenu extends React.Component {
  static propTypes = {
    studies: PropTypes.any,
    viewports: PropTypes.any,
    activeIndex: PropTypes.any,
  };

  static defaultProps = {
    studies: undefined,
    viewports: undefined,
    activeIndex: undefined,
  };

  constructor(props = {}) {
    super(props);

    this.state = {
      showSettings: false,
    };
  }

  render() {
    const {
      showSettings,
    } = this.state;

    let component;

    if (showSettings) {
      component = (
        <AIAAMenuSettings
          // settings={modules.freehand3D.configuration}
          // onChange={this.configurationChangeHandler}
        />
      );
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
            style={{ marginTop: 5 }}
            onClick={() => this.setState({ showSettings: !showSettings })}
          />
        </div>
        <div>{component}</div>
      </div>
    );
  }
}*/