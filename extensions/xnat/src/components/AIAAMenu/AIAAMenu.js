import React from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import { Icon } from '@ohif/ui';
import AIAAMenuSettings from './AIAAMenuSettings';
import AIAAToolkit from './AIAAToolkit';
import showNotification from '../common/showNotification';
import { showStatusModal, updateStatusModal } from '../common/statusModal.js';
import { AIAA_TOOL_TYPES, AIAA_MODEL_TYPES } from '../../aiaa-tools';
import refreshViewport from '../../utils/refreshViewport.js';

import '../XNATRoiPanel.styl';

const modules = csTools.store.modules;
const segmentationModule = csTools.getModule('segmentation');
const LOCAL_TEST = true;

export default class AIAAMenu extends React.Component {
  static propTypes = {
    studies: PropTypes.any,
    viewports: PropTypes.any,
    activeIndex: PropTypes.any,
    firstImageId: PropTypes.any,
    segmentsData: PropTypes.object,
    onNewSegment: PropTypes.func,
    featureStore: PropTypes.object,
    onUpdateFeatureStore: PropTypes.func,
  }

  static defaultProps = {
    studies: undefined,
    viewports: undefined,
    activeIndex: undefined,
    firstImageId: undefined,
    segmentsData: undefined,
    onNewSegment: undefined,
    featureStore: undefined,
    onUpdateFeatureStore: undefined,
  }

  constructor(props = {}) {
    super(props);

    const { settings } = props.featureStore;
    this._aiaaModule = modules.aiaa;
    this._aiaaClient = this._aiaaModule.client;
    this._aiaaClient.api.setServerURL(settings.serverUrl);

    const { viewports, studies, activeIndex } = props;
    this._viewParameters =
      this.getViewParameters(viewports, studies, activeIndex);

    this.state = {
      showSettings: false,
      models: this._aiaaClient.models,
      api: {
        isConnected: this._aiaaClient.isConnected,
        isConnecting: !this._aiaaClient.isConnected,
      },
    };

    this.onToggleShowSettings = this.onToggleShowSettings.bind(this);
    this.onSaveSettings = this.onSaveSettings.bind(this);
    this.onGetModels = this.onGetModels.bind(this);
    this.onToolUpdate = this.onToolUpdate.bind(this);
    this.onRunModel = this.onRunModel.bind(this);
    this.aiaaProbToolEventListenerHandler =
      this.aiaaProbToolEventListenerHandler.bind(this);
    this.onClearPoints = this.onClearPoints.bind(this);
  }

  componentDidMount() {
    this._aiaaModule.state.menuIsOpen = true;
    if (!this._aiaaClient.isConnected) {
      this.onGetModels();
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.firstImageId !== prevProps.firstImageId) {
      const { viewports, studies, activeIndex } = this.props;
      this._viewParameters =
        this.getViewParameters(viewports, studies, activeIndex);
    }
  }

  componentWillUnmount() {
    this._aiaaModule.state.menuIsOpen = false;
  }

  setToolActive(element) {
    csTools.setToolActiveForElement(
      element, 'AIAAProbeTool', { mouseButtonMask: 1 });
    element.addEventListener(
      'nvidiaaiaaprobeevent',
      this.aiaaProbToolEventListenerHandler
    );
  }

  setToolDisabled(element) {
    element.removeEventListener(
      'nvidiaaiaaprobeevent',
      this.aiaaProbToolEventListenerHandler
    );
    csTools.setToolDisabledForElement(element, 'AIAAProbeTool', {});
  }

  async aiaaProbToolEventListenerHandler(evt) {
    // const { segments, activeSegmentIndex } = this.props.segmentsData;
    // let segIndex = segments.findIndex(seg => {
    //   return seg.index === activeSegmentIndex;
    // });
    // if (segIndex < 0) {
    //   segIndex = segments.length - 1;
    // }
    // const segmentUid = segments[segIndex].metadata.uid;
    const { imageIds } = this._viewParameters;
    const { x, y, imageId, ctrlKey, segmentUid, toolType, color } = evt.detail;
    const pointData = {
      x: x,
      y: y,
      z: imageIds.indexOf(imageId),
      imageId: imageId,
      background: ctrlKey,
      color: color,
    };

    this._aiaaModule.setters.points(
      toolType,
      segmentUid,
      pointData
    );
  }

  getViewParameters(viewports, studies, activeIndex) {
    const viewport = viewports[activeIndex];

    const {
      StudyInstanceUID,
      SeriesInstanceUID,
      displaySetInstanceUID,
    } = viewport;

    const element = cornerstone.getEnabledElements()[activeIndex].element;
    const stackToolState = csTools.getToolState(element, 'stack');
    const imageIds = stackToolState.data[0].imageIds;

    // const imageIdsToIndex = new Map();
    // for (let i = 0; i < imageIds.length; i++) {
    //   imageIdsToIndex.set(imageIds[i], i);
    // }

    return {
      StudyInstanceUID,
      SeriesInstanceUID,
      displaySetInstanceUID,
      imageIds,
      // imageIdsToIndex,
      element,
    };
  }

  onToggleShowSettings = () => {
    this.setState({
      showSettings: !this.state.showSettings,
    });
  }

  onSaveSettings = newSettings => {
    this.onToggleShowSettings();

    const { featureStore, onUpdateFeatureStore } = this.props;
    if(featureStore.settings.serverUrl !== newSettings.serverUrl) {
      this._aiaaClient.api.setServerURL(newSettings.serverUrl);
      this.onGetModels();
    }

    if (!_.isEqual(newSettings, featureStore.settings)) {
      // update feature store
      onUpdateFeatureStore({
        ...featureStore,
        settings: {
          ...featureStore.settings,
          ...newSettings,
        }
      });
    }
  }

  onClearPoints(all = true) {
    const toolType = this._aiaaClient.currentTool.type;
    const { element, imageIds } = this._viewParameters;


    refreshViewport();

  }

  onGetModels = async () => {
    const modal = showStatusModal('Collecting model list from AIAA server...');
    this.setState({
      models: [],
      api: {
        isConnected: false,
        isConnecting: true,
      }
    });

    const { element } = this._viewParameters;
    this.setToolDisabled(element);

    if (LOCAL_TEST) {
      await this._aiaaClient.getTestModels();
    } else {
      await this._aiaaClient.getModels();
    }
    this.setState({
      models: this._aiaaClient.models,
      api: {
        isConnected: this._aiaaClient.isConnected,
        isConnecting: false,
      }
    });

    if (this._aiaaClient.isConnected) {
      this.setToolActive(element);
    }

    modal.close();
  }

  onToolUpdate = async () => {
    refreshViewport();
  }

  onRunModel = async () => {
    const modal = showStatusModal();

    let runResult;
    if (LOCAL_TEST) {
      runResult = await this._aiaaClient.readTestFile();
    } else {
      const parameters = {
        SeriesInstanceUID: this._viewParameters.SeriesInstanceUID,
        imageIds: this._viewParameters.imageIds,
      };

      runResult = await this._aiaaClient.runModel(parameters, updateStatusModal);
    }

    if (runResult === null) {
      modal.close();
      return;
    }

    const { segments, activeSegmentIndex } = this.props.segmentsData;
    let activeIndex = activeSegmentIndex;

    // Create new segment if collection is empty (for annotation & deepgraw)
    // if (this._aiaaClient.currentTool.type === AIAA_MODEL_TYPES.ANNOTATION
    //   || this._aiaaClient.currentTool.type === AIAA_MODEL_TYPES.DEEPGROW) {
    //   if (segments.length === 0) {
    //     activeIndex =
    //       await this.props.onNewSegment(
    //         `AIAA - ${this._aiaaClient.currentTool.name}`);
    //   }
    // } else
    if (this._aiaaClient.currentTool.type === AIAA_MODEL_TYPES.SEGMENTATION) {
      const labels = this._aiaaClient.currentModel.labels;
      let indexes = [];
      for (let l = 0; l < labels.length; l++) {
        indexes.push(
          await this.props.onNewSegment(
            `AIAA - ${labels[l]}`)
        );
      }
      activeIndex = indexes[0];
    }

    this.updateLabelmap(runResult.image, activeIndex);

    modal.close();
  }

  updateLabelmap(image, activeIndex) {
    /*
                            updateView      slice
    seg / ann               null            null
    seg/ann & !multi_label  overlap
    deepgrow                override        sliceIndex
    * */
    let updateType = undefined;
    const segmentOffset = activeIndex - 1;

    const { firstImageId, segmentsData } = this.props;
    const { imageIds } = this._viewParameters;

    const { state } = segmentationModule;
    const brushStackState = state.series[firstImageId];

    let labelmap3D = null;

    if (brushStackState) {
      const { activeLabelmapIndex } = brushStackState;
      labelmap3D = brushStackState.labelmaps3D[activeLabelmapIndex];
    }

    if (labelmap3D === null) {
      return;
    }

    const numberOfFrames = imageIds.length;
    const labelmaps2D = labelmap3D.labelmaps2D;
    const slicelengthInBytes = image.byteLength / numberOfFrames;
    const sliceLength = slicelengthInBytes / 2; //UInt16


    for (let s = 0; s < numberOfFrames; s++) {
      const sliceOffset = slicelengthInBytes * s;
      const imageData = new Uint16Array(image, sliceOffset, sliceLength);

      if (imageData.indexOf(1) === -1) {
        continue;
      }

      const labelmap = segmentationModule.getters.labelmap2DByImageIdIndex(
        labelmap3D, s, sliceLength, 1
      );

      let labelmapData = labelmap.pixelData;

      for (let j = 0; j < imageData.length; j++) {
        if (imageData[j] > 0) {
          labelmapData[j] = imageData[j] + segmentOffset;
        }
      }

      segmentationModule.setters.updateSegmentsOnLabelmap2D(labelmap);

      refreshViewport();

      // debugger;
      // return;

      // if (!labelmaps2D[s]) {
      //
      // }

      // if (!labelmaps2D[s]
      //   || !labelmaps2D[s].segmentsOnLabelmap
      //   || !labelmaps2D[s].segmentsOnLabelmap.length) {
      //   // In case when the slice has no segments
      //   updateType = 'override';
      // }

      // let useSourceBuffer = false;
      // for (let j = 0; j < imageData.length; j++) {
        // if (updateType === 'overlap') {
        //   if (imageData[j] > 0) {
        //     labelmapData[j] = imageData[j] + segmentOffset;
        //   }
        //   useSourceBuffer = true;
        // } else if (updateType === 'override') {
        //   if (labelmapData[j] === activeIndex) {
        //     labelmapData[j] = 0;
        //   }
        //   if (imageData[j] > 0) {
        //     labelmapData[j] = imageData[j] + segmentOffset;
        //   }
        //   useSourceBuffer = true;
        // } else {
        //   if (imageData[j] > 0) {
        //     imageData[j] = imageData[j] + segmentOffset;
        //   }
        // }
      // }
    }
  }

  render() {
    const { featureStore } = this.props;
    const { settings } = featureStore;
    const { showSettings, api, models } = this.state;

    let statusMessage = null;
    if (api.isConnecting) {
      statusMessage =
        <p>{`Connecting to ${this._aiaaClient.api.getServerURL()} ...`}</p>
    } else if (!api.isConnected) {
      statusMessage =
        <p style={{ color: 'var(--snackbar-error)' }}>
          {`Error connecting to ${this._aiaaClient.api.getServerURL()}`}
        </p>
    }

    return (
      <div className="roiPanelFooter">
        <div className="title-with-icon">
          <h4>NVIDIA AI-Assisted Annotation
            {showSettings &&
            <>
              <span style={{ color: 'var(--active-color)' }}> | </span>
              <span style={{ fontWeight: 'normal' }}>Settings</span>
            </>
            }
          </h4>
          <Icon
            className="settings-icon"
            name={showSettings ? 'xnat-cancel' : 'cog'}
            width="15px"
            height="15px"
            style={{ marginTop: 5, marginLeft: 'auto' }}
            onClick={this.onToggleShowSettings}
          />
          {!showSettings &&
            <Icon
              className="settings-icon"
              name="reset"
              width="15px"
              height="15px"
              style={{ marginTop: 5 }}
              onClick={() => this.onGetModels()}
            />
          }
        </div>
        {showSettings ?
          <AIAAMenuSettings
            settings={settings}
            onSave={this.onSaveSettings}
          /> :
          (statusMessage ?
              <div className="footerSection" style={{ marginBottom: 5 }}>
                <div className="footerSectionItem"
                     style={{ marginBottom: 10, marginTop: 0 }}>
                  {statusMessage}
                </div>
              </div>
              :
              <AIAAToolkit
                models={models}
                onToolUpdate={this.onToolUpdate}
                onClearPoints={this.onClearPoints}
                onRunModel={this.onRunModel}
              />
          )
        }
      </div>
    );
  }
}