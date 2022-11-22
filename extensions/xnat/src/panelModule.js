import React from 'react';
import XNATNavigationPanel from './components/XNATNavigationPanel.js';
import XNATContourPanel from './components/XNATContourPanel.js';
import XNATSegmentationPanel from './components/XNATSegmentationPanel.js';
import XNATSegmentationColorSelectModal from './components/XNATSegmentationColorSelectModal/XNATSegmentationColorSelectModal';
import XNATMeasurementPanel from './components/XNATMeasurementPanel';
// import { XNATMeasurementPanel } from './XNATMeasurement';

const PanelModule = (commandsManager, api, servicesManager) => {
  const { UIModalService } = servicesManager.services;

  const showColorSelectModal = (
    labelmap3D,
    segmentIndex,
    segmentLabel,
    onColorChangeCallback
  ) => {
    let title = 'Select color for ';

    if (segmentLabel) {
      title += segmentLabel;
    } else {
      title += `segment ${segmentIndex}`;
    }

    if (UIModalService) {
      UIModalService.show({
        content: XNATSegmentationColorSelectModal,
        title,
        contentProps: {
          labelmap3D,
          segmentIndex,
          onColorChangeCallback,
          onClose: UIModalService.hide,
        },
      });
    }
  };

  const roiItemClickHandler = data => {
    commandsManager.runCommand('jumpToImage', data);
  };

  const ExtendedXNATContourPanel = props => {
    return (
      <XNATContourPanel
        {...props}
        onContourItemClick={roiItemClickHandler}
        UIModalService={UIModalService}
      />
    );
  };

  const ExtendedXNATSegmentationPanel = props => {
    return (
      <XNATSegmentationPanel
        {...props}
        showColorSelectModal={showColorSelectModal}
        onSegmentItemClick={roiItemClickHandler}
      />
    );
  };

  const ExtendedXNATMeasurementPanel = props => {
    return (
      <XNATMeasurementPanel {...props} onJumpToItem={roiItemClickHandler} />
    );
  };

  return {
    menuOptions: [
      {
        icon: 'th-large',
        label: 'Scans',
        from: 'left',
        target: 'studies',
      },
      {
        icon: 'list',
        label: 'XNAT Nav',
        from: 'left',
        target: 'xnat-navigation-panel',
      },
      {
        icon: 'xnat-contour',
        label: 'Contours',
        from: 'right',
        target: 'xnat-contour-panel',
      },
      {
        icon: 'xnat-mask',
        label: 'Masks',
        from: 'right',
        target: 'xnat-segmentation-panel',
      },
      {
        icon: 'xnat-annotations',
        label: 'Measurements',
        from: 'right',
        target: 'xnat-measurement-panel',
      },
    ],
    components: [
      {
        id: 'xnat-navigation-panel',
        component: XNATNavigationPanel,
      },
      {
        id: 'xnat-contour-panel',
        component: ExtendedXNATContourPanel,
      },
      {
        id: 'xnat-segmentation-panel',
        component: ExtendedXNATSegmentationPanel,
      },
      {
        id: 'xnat-measurement-panel',
        component: ExtendedXNATMeasurementPanel,
      },
    ],
    defaultContext: ['ACTIVE_VIEWPORT::CORNERSTONE'],
  };
};

export default PanelModule;
