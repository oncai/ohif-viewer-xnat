const defaultState = {
  windowLevelData: {
    1: { description: 'Soft tissue', window: '550', level: '40' },
    2: { description: 'Lung', window: '1500', level: '-600' },
    3: { description: 'Liver', window: '150', level: '90' },
    4: { description: 'Bone', window: '2500', level: '480' },
    5: { description: 'Brain', window: '80', level: '40' },
    6: { description: 'Trest', window: '1', level: '1' },
    7: { description: '', window: '', level: '' },
    8: { description: '', window: '', level: '' },
    9: { description: '', window: '', level: '' },
    10: { description: '', window: '', level: '' },
  },
  generalPreferences: {
    // language: 'en-US'
  },
  experimentalFeatures: {
    NVIDIAClaraAIAA: {
      id: 'NVIDIAClaraAIAA',
      name: 'NVIDIA Clara AIAA',
      enabled: false,
      settings: {
        serverUrl: '',
        overlapSegments: false,
      },
    },
    MONAILabel: {
      id: 'MONAILabel',
      name: 'MONAILabel Tools',
      enabled: false,
      settings: {
        serverUrl: '',
        overlapSegments: false,
      },
    },
    ContourROILazyLoading: {
      id: 'ContourROILazyLoading',
      name: 'Contour ROI Lazy Loading',
      enabled: false,
    },
    ConcurrentPolygonExtraction: {
      id: 'ConcurrentPolygonExtraction',
      name: 'RTStruct Concurrent Polygon Extraction',
      enabled: true,
    },
    DisplayScanFromTheMiddle: {
      id: 'DisplayScanFromTheMiddle',
      name: 'Load image slices from the middle',
      enabled: false,
    },
    ShowModalOnNewAnnotation: {
      id: 'ShowModalOnNewAnnotation',
      name: 'Show options dialog on creating a new annotation',
      enabled: true,
    },
  },
};

const preferences = (state = defaultState, action) => {
  switch (action.type) {
    case 'SET_USER_PREFERENCES': {
      return Object.assign({}, state, action.state);
    }
    default:
      return state;
  }
};

export { defaultState };
export default preferences;
