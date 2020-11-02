import './OHIFLogo.css';

import { Icon } from '@ohif/ui';
import React from 'react';
import { useIdleTimer } from 'react-idle-timer';
import { userManagement } from '@xnat-ohif/extension-xnat';

const timeout = 1000 * 60 * 10;
let timeSinceLastApi = 0;

function OHIFLogo() {
  const handleOnAction = () => {
    if (timeSinceLastApi >= timeout) {
      // invoke api call
      userManagement.getSessionID()
        .then(data => {
          console.log('Keeping the XNAT session alive...');
        })
        .catch(error => {
          console.warn(error);
        });
      timeSinceLastApi = 0;
      reset();
    } else {
      timeSinceLastApi = getElapsedTime();
    }
  }

  const { getElapsedTime, reset } = useIdleTimer({
    timeout: timeout,
    events: [
      'keydown',
      'wheel',
      'mousewheel',
      'mousedown',
      'touchstart',
      'touchmove'
    ],
    onAction: handleOnAction,
    startOnMount: false,
    debounce: 500
  });


  return (
    <a
      target="_blank"
      // rel="noopener noreferrer"
      className="header-brand"
      // href="http://ohif.org"
    >
      <Icon name="xnat-ohif-logo" className="header-logo-image" />
      <Icon name="xnat-icr-logo" className="header-logo-image-icr" />
      <div className="header-logo-text">OHIF-XNAT Viewer</div>
      {/*<Icon name="ohif-logo" className="header-logo-image" />*/}
      {/* Logo text would fit smaller displays at two lines:
       *
       * Open Health
       * Imaging Foundation
       *
       * Or as `OHIF` on really small displays
       */}
      {/*<Icon name="ohif-text-logo" className="header-logo-text" />*/}
    </a>
  );
}

export default OHIFLogo;
