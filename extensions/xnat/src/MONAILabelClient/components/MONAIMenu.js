import React from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import { Icon } from '@ohif/ui';
import MONAIToolkit from './MONAIToolkit';
import showNotification from '../../components/common/showNotification';
import {
  showStatusModal,
  updateStatusModal,
} from '../../components/common/statusModal.js';
import refreshViewports from '../../utils/refreshViewports.js';
import { removeEmptyLabelmaps2D } from '../../peppermint-tools';
import isValidUrl from '../../utils/isValidUrl.js';
import sessionMap from '../../utils/sessionMap';
import updateLabelmap from '../utils/updateLabelmap';

import '../../components/XNATRoiPanel.styl';

const modules = csTools.store.modules;
const segmentationModule = csTools.getModule('segmentation');
const LOCAL_TEST = false;

export default class MONAIMenu extends React.Component {
  static propTypes = {
    studies: PropTypes.any.isRequired,
    viewports: PropTypes.any.isRequired,
    activeIndex: PropTypes.any.isRequired,
    firstImageId: PropTypes.any.isRequired,
    segmentsData: PropTypes.object.isRequired,
    onNewOrUpdateSegments: PropTypes.func.isRequired,
  };

  constructor(props = {}) {
    super(props);

    this._monaiModule = modules.monai;
    this._monaiClient = this._monaiModule.client;

    this._serverUrl = '';
    const { site, project } = sessionMap.getAiaaSettings().serverUrl;
    if (project.length !== 0) {
      this._serverUrl = project;
    } else if (site.length !== 0) {
      this._serverUrl = site;
    }
    this._monaiClient.api.setServerURL(this._serverUrl);

    const { viewports, studies, activeIndex } = props;
    this._viewParameters = this.getViewParameters(
      viewports,
      studies,
      activeIndex
    );

    this.state = {
      models: this._monaiClient.models,
      api: {
        isConnected: this._monaiClient.isConnected,
        isConnecting: !this._monaiClient.isConnected,
      },
    };

    this.onGetModels = this.onGetModels.bind(this);
    this.onToolUpdate = this.onToolUpdate.bind(this);
    this.onRunModel = this.onRunModel.bind(this);
    this.monaiProbToolEventListenerHandler = this.monaiProbToolEventListenerHandler.bind(
      this
    );
    this.onClearPoints = this.onClearPoints.bind(this);
  }

  componentDidMount() {
    this._monaiModule.state.menuIsOpen = true;
    if (!this._monaiClient.isConnected) {
      this.onGetModels();
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.firstImageId !== prevProps.firstImageId) {
      const { viewports, studies, activeIndex } = this.props;
      this._viewParameters = this.getViewParameters(
        viewports,
        studies,
        activeIndex
      );
    }
  }

  componentWillUnmount() {
    this._monaiModule.state.menuIsOpen = false;
  }

  setToolActive(element) {
    csTools.setToolActiveForElement(element, 'AIAAProbeTool', {
      mouseButtonMask: 1,
    });
    element.addEventListener(
      'monaiprobeevent',
      this.monaiProbToolEventListenerHandler
    );
  }

  setToolDisabled(element) {
    element.removeEventListener(
      'monaiprobeevent',
      this.monaiProbToolEventListenerHandler
    );
    csTools.setToolDisabledForElement(element, 'AIAAProbeTool', {});
  }

  async monaiProbToolEventListenerHandler(evt) {
    const { z, pointCollectionId, modelDimension } = evt.detail;
    const segmentPoints =
      modelDimension === 3
        ? this._monaiModule.getters.points(pointCollectionId)
        : this._monaiModule.getters.points(pointCollectionId, z);

    this.onRunModel({ segmentPoints, frameIndex: z });
  }

  getViewParameters(viewports, studies, activeIndex) {
    const viewport = viewports[activeIndex];

    const {
      StudyInstanceUID,
      SeriesInstanceUID,
      displaySetInstanceUID,
    } = viewport;

    const element = cornerstone.getEnabledElements()[activeIndex].element;

    return {
      StudyInstanceUID,
      SeriesInstanceUID,
      displaySetInstanceUID,
      element,
    };
  }

  onClearPoints(all = true) {
    const { SeriesInstanceUID } = this._viewParameters;
    const { segments, activeSegmentIndex } = this.props.segmentsData;

    if (!all) {
      const segIndex = segments.findIndex(seg => {
        return seg.index === activeSegmentIndex;
      });
      if (segIndex < 0) {
        return;
      }
      const segmentUid = segments[segIndex].metadata.uid;
      this._monaiModule.setters.removeModelSegmentPoints(
        SeriesInstanceUID,
        segmentUid
      );
    } else {
      // Remove tool points for all segments
      const segmentUids = [];
      segments.forEach(seg => {
        segmentUids.push(seg.metadata.uid);
      });
      if (segmentUids.length === 0) {
        // A DeepEdit model
        segmentUids.push('');
      }
      this._monaiModule.setters.removeModelAllPoints(
        SeriesInstanceUID,
        segmentUids
      );
    }

    refreshViewports();
  }

  onGetModels = async () => {
    if (!isValidUrl(this._monaiClient.api.getServerURL())) {
      return;
    }

    const modal = showStatusModal('Collecting model list from MONAILabel...');
    this.setState({
      models: [],
      api: {
        isConnected: false,
        isConnecting: true,
      },
    });

    const { element } = this._viewParameters;
    this.setToolDisabled(element);

    if (LOCAL_TEST) {
      await this._monaiClient.getTestModels();
    } else {
      await this._monaiClient.getModels();
    }
    this.setState({
      models: this._monaiClient.models,
      api: {
        isConnected: this._monaiClient.isConnected,
        isConnecting: false,
      },
    });

    if (this._monaiClient.isConnected) {
      this.setToolActive(element);
    }

    modal.close();
  };

  onToolUpdate = async () => {
    refreshViewports();
  };

  onRunModel = async pointData => {
    const modal = showStatusModal();

    const { element } = this._viewParameters;
    const imageIds = _getImageIdsForElement(element);
    const enabledElement = cornerstone.getEnabledElement(element);
    const refImage = enabledElement.image;
    const refImageSize = {
      width: refImage.width,
      height: refImage.height,
      numberOfFrames: imageIds.length,
    };
    const { activeSegmentIndex } = this.props.segmentsData;

    // Invoke to ensure creating labelmap3D if it is not available yet
    const _x = segmentationModule.getters.labelmap2D(element);

    let result;
    try {
      if (LOCAL_TEST) {
        result = await this._monaiClient.readTestFile(imageIds);
      } else {
        const parameters = {
          SeriesInstanceUID: this._viewParameters.SeriesInstanceUID,
          imageIds,
          segmentPoints: pointData && pointData.segmentPoints,
          activeSegmentIndex,
        };

        result = await this._monaiClient.runModel(
          parameters,
          updateStatusModal
        );
      }
    } catch (error) {
      modal.close();
      showNotification(
        error.message || 'Unknown error!',
        'error',
        'MONAILabel'
      );
      return;
    }

    if (!result || !result.maskArray) {
      modal.close();
      showNotification(
        'Error in parsing the mask image',
        'error',
        'MONAILabel'
      );
      return;
    }

    const maskImageSize = result.size;
    console.log(`Mask image size = 
                ${maskImageSize.width}, 
                ${maskImageSize.height}, 
                ${maskImageSize.numberOfFrames}`);

    if (!_.isEqual(refImageSize, maskImageSize)) {
      modal.close();
      showNotification(
        'Error: Size mismatch between the mask and reference images',
        'error',
        'MONAILabel'
      );
      return;
    }

    const { maskArray, size, matchingLabels, segIndices } = result;

    if (!matchingLabels.length) {
      showNotification(
        'Empty mask was returned by the model run.',
        'warning',
        'MONAILabel'
      );
      modal.close();
      return;
    }

    try {
      const { firstImageId } = this.props;
      const { state } = segmentationModule;
      const brushStackState = state.series[firstImageId];
      const { activeLabelmapIndex } = brushStackState;
      const labelmap3D = brushStackState.labelmaps3D[activeLabelmapIndex];

      updateLabelmap(
        this._monaiClient.currentModel,
        labelmap3D,
        maskArray,
        size,
        pointData && pointData.frameIndex,
        segIndices
      );

      removeEmptyLabelmaps2D(labelmap3D);
    } catch (error) {
      showNotification(
        error.message || 'Unknown error!',
        'error',
        'MONAILabel'
      );
    }

    this.props.onNewOrUpdateSegments(matchingLabels);
    refreshViewports();

    modal.close();
  };

  render() {
    const { api, models } = this.state;

    const serverUrl = this._serverUrl;

    let statusMessage = null;
    // if (settings.serverUrl.length === 0) {
    if (serverUrl.length === 0) {
      statusMessage = (
        <p style={{ color: 'var(--snackbar-error)' }}>
          To use AIAA tools, please ask a site admin to add server URL
        </p>
      );
    } else if (api.isConnecting) {
      statusMessage = <p>{`Connecting to ${serverUrl} ...`}</p>;
    } else if (!api.isConnected) {
      statusMessage = (
        <p style={{ color: 'var(--snackbar-error)' }}>
          {`Error connecting to ${serverUrl}`}
        </p>
      );
    }

    return (
      <div className="roiPanelFooter">
        <div className="title-with-icon">
          <h4>MONAILabel</h4>
          <Icon
            className="settings-icon"
            name="reset"
            width="15px"
            height="15px"
            style={{ marginTop: 5, marginLeft: 'auto' }}
            onClick={() => this.onGetModels()}
          />
          {/*}*/}
        </div>
        {statusMessage ? (
          <div className="footerSection" style={{ marginBottom: 5 }}>
            <div
              className="footerSectionItem"
              style={{ marginBottom: 10, marginTop: 0 }}
            >
              {statusMessage}
            </div>
          </div>
        ) : (
          <MONAIToolkit
            serverUrl={serverUrl}
            models={models}
            onToolUpdate={this.onToolUpdate}
            onClearPoints={this.onClearPoints}
            onRunModel={this.onRunModel}
          />
        )}
      </div>
    );
  }
}

function _getImageIdsForElement(element) {
  const stackToolState = csTools.getToolState(element, 'stack');
  return stackToolState.data[0].imageIds;
}
