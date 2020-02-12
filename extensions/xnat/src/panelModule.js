import XNATNavigationPanel from './components/XNATNavigationPanel.js';
import XNATContourPanel from './components/XNATContourPanel.js';
import XNATSegmentationPanel from './components/XNATSegmentationPanel.js';

export default {
  menuOptions: [
    {
      icon: 'list',
      label: 'XNAT Nav',
      from: 'left',
      target: 'xnat-navigation-panel',
    },
    {
      icon: 'list',
      label: 'Seg',
      from: 'right',
      target: 'xnat-segmentation-panel',
    },
    {
      icon: 'list',
      label: 'ROI',
      from: 'right',
      target: 'xnat-contour-panel',
    },
  ],
  components: [
    {
      id: 'xnat-navigation-panel',
      component: XNATNavigationPanel,
    },
    {
      id: 'xnat-contour-panel',
      component: XNATContourPanel,
    },
    {
      id: 'xnat-segmentation-panel',
      component: XNATSegmentationPanel,
    },
  ],
  defaultContext: ['VIEWER'],
};
