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
import { MONAI_MODEL_TYPES } from '../api';

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
    onNewSegment: PropTypes.func.isRequired,
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
    const { z, segmentUid, toolType } = evt.detail;
    let segmentPoints = this._monaiModule.getters.segmentPoints(
      segmentUid,
      toolType
    );

    if (toolType === MONAI_MODEL_TYPES.ANNOTATION) {
      const minPoints = this._monaiModule.configuration.annotationMinPoints;
      if (segmentPoints.fg.length === 1) {
        showNotification(
          `The Annotation tool requires >= ${minPoints} points to run`,
          'warning',
          'MONAILabel'
        );
        return;
      } else if (segmentPoints.fg.length < minPoints) {
        return;
      }
    }

    if (toolType === MONAI_MODEL_TYPES.DEEPGROW) {
      const deepgrowModel = this._monaiClient.currentModel;
      if (deepgrowModel.dimension === 2) {
        segmentPoints.fg = segmentPoints.fg.filter(p => {
          return p[2] === z;
        });
        segmentPoints.bg = segmentPoints.bg.filter(p => {
          return p[2] === z;
        });
      }
    }

    this.onRunModel(segmentPoints);
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
    const toolType = this._monaiClient.currentTool.type;
    const { element } = this._viewParameters;
    const { segments, activeSegmentIndex } = this.props.segmentsData;

    let imageIdsPoints;
    if (!all) {
      const segIndex = segments.findIndex(seg => {
        return seg.index === activeSegmentIndex;
      });
      if (segIndex < 0) {
        return;
      }
      const segmentUid = segments[segIndex].metadata.uid;
      imageIdsPoints = this._monaiModule.setters.removePointsForSegment(
        segmentUid,
        toolType
      );
    } else {
      // Remove tool points for all segments
      let segmentUids = [];
      segments.forEach(seg => {
        segmentUids.push(seg.metadata.uid);
      });
      if (segmentUids.length === 0) {
        return;
      }
      imageIdsPoints = this._monaiModule.setters.removePointsForAllSegments(
        segmentUids,
        toolType
      );
    }

    if (_.isEmpty(imageIdsPoints)) {
      return;
    }

    const enabledElement = cornerstone.getEnabledElement(element);
    const currentImageId = enabledElement.image.imageId;
    Object.keys(imageIdsPoints).forEach(id => {
      enabledElement.image.imageId = id;
      const toolData = csTools.getToolState(
        enabledElement.element,
        'AIAAProbeTool'
      );
      if (!toolData) {
        return;
      }
      const pointUuids = imageIdsPoints[id];
      toolData.data = toolData.data.filter(data => {
        return pointUuids.indexOf(data.uuid) === -1;
      });
    });
    enabledElement.image.imageId = currentImageId;

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

  onRunModel = async (segmentPoints = {}) => {
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

    let maskImage;
    if (LOCAL_TEST) {
      maskImage = await this._monaiClient.readTestFile(imageIds);
    } else {
      const parameters = {
        SeriesInstanceUID: this._viewParameters.SeriesInstanceUID,
        imageIds,
        segmentPoints: segmentPoints,
      };

      maskImage = await this._monaiClient.runModel(
        parameters,
        updateStatusModal
      );
    }

    if (!maskImage || !maskImage.data) {
      modal.close();
      showNotification(
        'Error in parsing the mask image',
        'error',
        'MONAILabel'
      );
      return;
    }

    const maskImageSize = maskImage.size;
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

    // const { segmentsData } = this.props;
    // let activeIndex = segmentsData.activeSegmentIndex;
    let activeIndex;
    if (this._monaiClient.currentTool.type === MONAI_MODEL_TYPES.SEGMENTATION) {
      const labels = this._monaiClient.currentModel.labels;
      let indexes = [];
      for (let l = 0; l < labels.length; l++) {
        indexes.push(this.props.onNewSegment(`AIAA - ${labels[l]}`));
      }
      activeIndex = indexes[0];
    } else {
      const labelmap3D = segmentationModule.getters.labelmap3D(
        this._viewParameters.element,
        0
      );
      const { activeSegmentIndex } = labelmap3D;
      activeIndex = activeSegmentIndex;
    }

    this.updateLabelmap(
      maskImage.data,
      maskImage.size,
      activeIndex,
      segmentPoints
    );

    modal.close();
  };

  updateLabelmap(image, size, activeIndex, segmentPoints) {
    /*
                            updateView      slice
    seg / ann               null            null
    seg/ann & !multi_label  overlap
    deepgrow                override        sliceIndex
    * */
    let updateType = undefined;
    const segmentOffset = activeIndex - 1;

    const { firstImageId } = this.props;

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

    const slicelengthInBytes = image.byteLength / size.numberOfFrames;
    const sliceLength = size.width * size.height; //slicelengthInBytes / 2; //UInt16
    const bytesPerVoxel = slicelengthInBytes / sliceLength;

    if (bytesPerVoxel !== 1 && bytesPerVoxel !== 2) {
      console.error(
        `No method for parsing ArrayBuffer to ${bytesPerVoxel}-byte array`
      );
      return;
    }

    const typedArray = bytesPerVoxel === 1 ? Uint8Array : Uint16Array;

    const updateSlice = (s, override = false) => {
      const sliceOffset = slicelengthInBytes * s;
      const imageData = new typedArray(image, sliceOffset, sliceLength);

      const imageHasData = imageData.some(pixel => pixel !== 0);
      if (!imageHasData) {
        return;
      }

      const labelmap = segmentationModule.getters.labelmap2DByImageIdIndex(
        labelmap3D,
        s,
        size.height,
        size.width
      );

      let labelmapData = labelmap.pixelData;

      for (let j = 0; j < imageData.length; j++) {
        if (imageData[j] > 0) {
          labelmapData[j] = imageData[j] + segmentOffset;
        } else if (override && labelmapData[j] === activeIndex) {
          labelmapData[j] = 0;
        }
      }

      segmentationModule.setters.updateSegmentsOnLabelmap2D(labelmap);
    };

    const isDeepgrow =
      this._monaiClient.currentTool.type === MONAI_MODEL_TYPES.DEEPGROW;

    if (isDeepgrow && this._monaiClient.currentModel.dimension === 2) {
      let sliceIndex;
      if (segmentPoints.fg.length > 0) {
        sliceIndex = segmentPoints.fg[0][2];
      } else if (segmentPoints.bg.length > 0) {
        sliceIndex = segmentPoints.fg[0][2];
      }
      updateSlice(sliceIndex, true);
    } else {
      for (let s = 0; s < size.numberOfFrames; s++) {
        updateSlice(s, isDeepgrow);
      }
    }

    removeEmptyLabelmaps2D(labelmap3D);

    refreshViewports();
  }

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
          <h4>
            NVIDIA AI-Assisted Annotation
          </h4>
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
