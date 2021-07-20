import React, { useState, useEffect } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Dropdown, AboutContent, withModal, Icon } from '@ohif/ui';
//
import { UserPreferences } from './../UserPreferences';
import OHIFLogo from '../OHIFLogo/OHIFLogo.js';
import './Header.css';
//
import { ICRHelpContent, ICRAboutContent } from '@xnat-ohif/extension-xnat';

function OptionsElement(props) {
  return (
    <div style={{ display: 'flex' }}>
      <Icon
        name="xnat-settings"
        width="18px"
        height="18px"
        // style={{ margin: '0 5 0 0' }}
      />
      <span style={{ marginLeft: 2 }}>Settings</span>
    </div>
  );
}

function Header(props) {
  const {
    t,
    user,
    userManager,
    modal: { show },
    useLargeLogo,
    linkPath,
    linkText,
    location,
    children,
  } = props;

  const [options, setOptions] = useState([]);
  const hasLink = linkText && linkPath;

  const xnatPath =
    window.location.origin + window.location.pathname.split('VIEWER')[0];

  useEffect(() => {
    const optionsValue = [
      {
        title: t('ICR Help'),
        icon: { name: 'xnat-help' },
        onClick: () =>
          show({
            content: ICRHelpContent,
            title: t('Using Contour & Mask Tools'),
          }),
      },
      // {
      //   title: t('About'),
      //   icon: { name: 'info' },
      //   onClick: () =>
      //     show({
      //       content: AboutContent,
      //       title: t('OHIF Viewer - About'),
      //     }),
      // },
      {
        title: t('Preferences'),
        icon: {
          name: 'user',
        },
        onClick: () =>
          show({
            content: UserPreferences,
            title: t('User Preferences'),
          }),
      },
      {
        title: t('About'),
        icon: { name: 'info' },
        onClick: () =>
          show({
            content: ICRAboutContent,
            title: t('OHIF-XNAT Viewer | About'),
          }),
      },
    ];

    if (user && userManager) {
      optionsValue.push({
        title: t('Logout'),
        icon: { name: 'power-off' },
        onClick: () => userManager.signoutRedirect(),
      });
    }

    setOptions(optionsValue);
  }, [setOptions, show, t, user, userManager]);

  return (
    <>
      {/*<div className="notification-bar">{t('INVESTIGATIONAL USE ONLY')}</div>*/}
      <div
        className={classNames('entry-header', { 'header-big': useLargeLogo })}
      >
        <div className="header-left-box">
          {location && location.studyLink && (
            <Link
              to={location.studyLink}
              className="header-btn header-viewerLink"
            >
              {t('Back to Viewer')}
            </Link>
          )}

          {children}

          <a href={xnatPath} className="header-btn header-studyListLinkSection">
            Back to XNAT
          </a>

          {hasLink && (
            <Link
              className="header-btn header-studyListLinkSection"
              to={{
                pathname: linkPath,
                state: { studyLink: location.pathname },
              }}
            >
              {t(linkText)}
            </Link>
          )}
        </div>

        <div className="header-menu">
          <span className="research-use">
            {/*{t('DEV-RELEASE | INVESTIGATIONAL USE ONLY')}*/}
            {/*{versionStr}*/}
          </span>
          <Dropdown
            // titleElement={<OptionsElement />}
            title={t('Options')}
            list={options}
            align="right"
          />
          {/*<Dropdown title={t('Options')} list={options} align="right" />*/}
        </div>
      </div>
    </>
  );
}

Header.propTypes = {
  // Study list, /
  linkText: PropTypes.string,
  linkPath: PropTypes.string,
  useLargeLogo: PropTypes.bool,
  //
  location: PropTypes.object.isRequired,
  children: PropTypes.node,
  t: PropTypes.func.isRequired,
  userManager: PropTypes.object,
  user: PropTypes.object,
  modal: PropTypes.object,
};

Header.defaultProps = {
  useLargeLogo: false,
  children: <OHIFLogo />,
};

export default withTranslation(['Header', 'AboutModal'])(
  withRouter(withModal(Header))
);
