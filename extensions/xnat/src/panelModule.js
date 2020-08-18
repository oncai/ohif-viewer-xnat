import React from 'react';
import XNATNavigationPanel from './components/XNATNavigationPanel.js';
import XNATContourPanel from './components/XNATContourPanel.js';
import XNATSegmentationPanel from './components/XNATSegmentationPanel.js';

// const moduleConfig = {
//   menuOptions: [
//     {
//       icon: 'th-large',
//       label: 'Scans',
//       from: 'left',
//       target: 'studies',
//     },
//     {
//       icon: 'list',
//       label: 'XNAT Nav',
//       from: 'left',
//       target: 'xnat-navigation-panel',
//     },
//     {
//       icon: 'xnat-contour',
//       label: 'Contours',
//       from: 'right',
//       target: 'xnat-contour-panel',
//     },
//     {
//       icon: 'xnat-mask',
//       label: 'Masks',
//       from: 'right',
//       target: 'xnat-segmentation-panel',
//     },
//   ],
//   components: [
//     {
//       id: 'xnat-navigation-panel',
//       component: XNATNavigationPanel,
//     },
//     {
//       id: 'xnat-contour-panel',
//       component: XNATContourPanel,
//     },
//     {
//       id: 'xnat-segmentation-panel',
//       component: XNATSegmentationPanel,
//     },
//   ],
//   defaultContext: ['VIEWER'],
// };

const PanelModule = servicesManager => {
  const { UIModalService } = servicesManager.services;

  const ExtendedXNATContourPanel = props => {
    return <XNATContourPanel {...props} UIModalService={UIModalService} />;
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
        component: XNATSegmentationPanel,
      },
    ],
    defaultContext: ['VIEWER'],
  };
};

// console.log(PanelModule());

export default PanelModule;
