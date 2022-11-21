import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';
import { useSelector, useDispatch } from 'react-redux';
import { redux } from '@ohif/core';

import { TabFooter, LanguageSwitcher, useSnackbarContext } from '@ohif/ui';
import { useTranslation } from 'react-i18next';

import './ExperimentalFeatures.styl';

const { actions } = redux;

/**
 * Experimental Features tab
 *
 * @param {object} props component props
 * @param {function} props.onClose
 */
function ExperimentalFeatures({ onClose }) {
  const { t } = useTranslation('UserPreferencesModal');
  const snackbar = useSnackbarContext();

  const dispatch = useDispatch();

  const experimentalFeatures = useSelector(state => {
    const { preferences = {} } = state;
    const { experimentalFeatures = {} } = preferences;

    return experimentalFeatures;
  });

  const [state, setState] = useState({
    features: { ...experimentalFeatures },
  });

  const onResetPreferences = () => {};

  const onSave = () => {
    dispatch(
      actions.setUserPreferences({ experimentalFeatures: state.features })
    );

    onClose();

    snackbar.show({
      message: t('SaveMessage'),
      type: 'success',
    });
  };

  const hasErrors = false;

  const onToggleClick = event => {
    const target = event.target;
    const { key } = target.dataset;

    if (!state.features[key]) {
      return;
    }

    const feature = state.features[key];
    const isEnabled = feature.enabled;

    let setStateEntry = {
      [key]: {
        ...feature,
        enabled: !isEnabled,
      },
    };

    if (!isEnabled && (key === 'NVIDIAClaraAIAA' || key === 'MONAILabel')) {
      const keyToDisable =
        key === 'NVIDIAClaraAIAA' ? 'MONAILabel' : 'NVIDIAClaraAIAA';
      const featureToDisable = state.features[keyToDisable];
      setStateEntry[keyToDisable] = {
        ...featureToDisable,
        enabled: false,
      };
    }

    setState(prevState => ({
      ...prevState,
      features: {
        ...prevState.features,
        ...setStateEntry,
      },
    }));
  };

  return (
    <React.Fragment>
      <div className="ExperimentalFeatures">
        {_.isEmpty(state.features) ?
          (
            <h4> No experimental features </h4>
          ) :
          Object.keys(state.features).map((key) => {
          return (
            <div className="feature" key={key}>
              <label className="featureLabel">
                {state.features[key].name}
              </label>
              <input
                type="checkbox"
                data-key={key}
                checked={state.features[key].enabled}
                onChange={onToggleClick}
              />
            </div>
          );
        })}
      </div>
      <TabFooter
        onResetPreferences={onResetPreferences}
        onSave={onSave}
        onCancel={onClose}
        hasErrors={hasErrors}
        t={t}
      />
    </React.Fragment>
  );
}

ExperimentalFeatures.propTypes = {
  onClose: PropTypes.func,
};

export { ExperimentalFeatures };
