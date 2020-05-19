import './OHIFLogo.css';

import { Icon } from '@ohif/ui';
import React from 'react';

function OHIFLogo() {
  return (
    <a
      target="_blank"
      className="header-brand"
    >
      <Icon name="xnat-ohif-logo" className="header-logo-image" />
      <Icon name="xnat-icr-logo" className="header-logo-image-icr" />
      {/* Logo text would fit smaller displays at two lines:
       *
       * Open Health
       * Imaging Foundation
       *
       * Or as `OHIF` on really small displays
       */}
      {/*<Icon name="ohif-text-logo" className="header-logo-text" />*/}
      <div className="header-logo-text">OHIF-XNAT Viewer</div>
    </a>
  );
}

export default OHIFLogo;
