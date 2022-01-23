import { Icon } from '@ohif/ui';
import React from 'react';
import { useIdleTimer } from 'react-idle-timer';
import { userManagement } from '@xnat-ohif/extension-xnat';
import xnat from '@xnat-ohif/extension-xnat';

import './OHIFLogo.css';

const { version } = xnat;

// const KeepAliveTimeout = 1000 * 60 * 0.5;
let timeSinceLastApi = 0;

function OHIFLogo() {
  const sessionTimeout = userManagement.getXNATSessionTimeout();
  const KeepAliveTimeout = Math.floor(sessionTimeout * 0.25);

  const handleOnAction = () => {
    if (timeSinceLastApi >= KeepAliveTimeout) {
      timeSinceLastApi = 0;
      reset();
      // invoke api call
      userManagement
        .getSessionID()
        .then(data => {
          console.log('Keeping the XNAT session alive...');
        })
        .catch(error => {
          console.warn(error);
        });
    } else {
      timeSinceLastApi = getElapsedTime();
    }
  };

  const handleOnIdle = event => {
    console.log('last active', getLastActiveTime());
    userManagement.logUserOut();
  };

  const { getElapsedTime, reset, getLastActiveTime } = useIdleTimer({
    timeout: sessionTimeout,
    events: [
      'keydown',
      'wheel',
      // 'mousemove',
      'mousewheel',
      'mousedown',
      'touchstart',
      'touchmove',
    ],
    onAction: handleOnAction,
    onIdle: handleOnIdle,
    startOnMount: true,
    debounce: 500,
  });

  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className="header-brand"
      href="https://bitbucket.org/icrimaginginformatics/ohif-viewer-xnat-plugin"
    >
      <Icon name="xnat-ohif-logo" className="header-logo-image" />
      <Icon name="xnat-icr-logo" className="header-logo-image-icr" />
      <div className="header-logo-text">
        OHIF-XNAT Viewer{' '}
        <span style={{ color: '#91b9cd', fontSize: 12 }}>|{` ${version}`}</span>
      </div>
    </a>
  );
}

export default React.memo(OHIFLogo);
