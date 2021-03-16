import React, { useState, useSelector } from 'react';
import PropTypes from 'prop-types';

import i18n from '@ohif/i18n';

import { TabFooter, LanguageSwitcher, useSnackbarContext } from '@ohif/ui';
import { useTranslation } from 'react-i18next';

import { stackSynchronizer } from '@xnat-ohif/extension-xnat';

import './GeneralPreferences.styl';

/**
 * General Preferences tab
 * It renders the General Preferences content
 *
 * @param {object} props component props
 * @param {function} props.onClose
 */
function GeneralPreferences({ onClose }) {
  const { t } = useTranslation('UserPreferencesModal');
  const snackbar = useSnackbarContext();
  const currentLanguage = i18n.language;
  const { availableLanguages } = i18n;

  const [language, setLanguage] = useState(currentLanguage);

  const syncStrategies = [
    'Index',
    'Position',
  ];

  const [syncStrategy, setSyncStrategy] = useState(
    stackSynchronizer.sycStrategy
  );

  const onResetPreferences = () => {
    setLanguage(i18n.defaultLanguage);
  };

  const onSave = () => {
    i18n.changeLanguage(language);

    stackSynchronizer.changeSynchronizationStrategy(syncStrategy);

    onClose();

    snackbar.show({
      message: t('SaveMessage'),
      type: 'success',
    });
  };

  const hasErrors = false;

  return (
    <React.Fragment>
      <div className="GeneralPreferences">
        <div className="generalItem">
          <label htmlFor="language-select" className="generalLabel">
            Language
          </label>
          <LanguageSwitcher
            language={language}
            onLanguageChange={setLanguage}
            languages={availableLanguages}
          />
        </div>
        <h2>Stack Scroll Synchronization Settings</h2>
        <hr />
        <div className="generalItem">
          <label htmlFor="sync-strategy-select" className="generalLabel">
            Sync Method
          </label>
          <select
            id="sync-strategy-select"
            value={syncStrategy}
            onChange={({target}) => setSyncStrategy(target.value)}
          >
            {syncStrategies.map((strategy, key) => (
              <option key={key} value={strategy}>
                {strategy}
              </option>
            ))}
          </select>
        </div>
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

GeneralPreferences.propTypes = {
  onClose: PropTypes.func,
};

export { GeneralPreferences };
