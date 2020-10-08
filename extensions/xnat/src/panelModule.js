import React from 'react';
import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import XNATNavigationPanel from './components/XNATNavigationPanel.js';
import XNATContourPanel from './components/XNATContourPanel.js';
import XNATSegmentationPanel from './components/XNATSegmentationPanel.js';
import XNATSegmentationColorSelectModal from './components/XNATSegmentationColorSelectModal/XNATSegmentationColorSelectModal';

function elementEnabledHandler(evt) {
  const element = evt.detail.element;
  element.addEventListener(csTools.EVENTS.MOUSE_CLICK, handleRightClick);
}

function elementDisabledHandler(evt) {
  const element = evt.detail.element;
  element.removeEventListener(csTools.EVENTS.MOUSE_CLICK, handleRightClick);
}

const PanelModule = (servicesManager, commandsManager) => {
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

  const contourItemClickHandler = contourData => {
    commandsManager.runCommand('jumpToImage', contourData);
  };

  const ExtendedXNATContourPanel = props => {
    return <XNATContourPanel
      {...props}
      onContourItemClick={contourItemClickHandler}
      UIModalService={UIModalService}
    />;
  };

  const ExtendedXNATSegmentationPanel = props => {
    return (
      <XNATSegmentationPanel
        {...props}
        showColorSelectModal={showColorSelectModal}
      />
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
    ],
    defaultContext: ['VIEWER'],
  };
};

// console.log(PanelModule());

export default PanelModule;
