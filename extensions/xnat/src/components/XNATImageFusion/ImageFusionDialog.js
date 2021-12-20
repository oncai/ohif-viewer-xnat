import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import OHIF from '@ohif/core';
import { commandsManager } from '@ohif/viewer/src/App';
import { Icon } from '@ohif/ui';
import { isEqual, isEmpty } from 'lodash';
import {
  CSOpacityRange,
  VTKIntensityRange,
  VTKOpacityRange,
} from './SliderRangeElements';

import './ImageFusionDialog.styl';

const { studyMetadataManager, StackManager } = OHIF.utils;

export const DEFAULT_FUSION_DATA = {
  StudyInstanceUID: '',
  displaySetInstanceUID: 'none',
  opacity: 0.5,
  visible: true,
};

const _getModality = ({ StudyInstanceUID, displaySetInstanceUID }) => {
  if (!StudyInstanceUID || displaySetInstanceUID === 'none') {
    return;
  }

  const studyMetadata = studyMetadataManager.get(StudyInstanceUID);
  const displaySet = studyMetadata.findDisplaySet(
    displaySet => displaySet.displaySetInstanceUID === displaySetInstanceUID
  );
  if (displaySet) {
    return displaySet.Modality;
  }
};

class ImageFusionDialog extends PureComponent {
  constructor(props) {
    super(props);

    const layerList = [
      {
        displaySetInstanceUID: DEFAULT_FUSION_DATA.displaySetInstanceUID,
        SeriesDescription: 'No fusion',
      },
    ];

    this.contextColormaps = props.colormaps;

    this.prevDisplaySetInstanceUID = 'none';

    this.state = {
      layerList: layerList,
      // Composition data
      ...DEFAULT_FUSION_DATA,
      colormap: this.contextColormaps.defaultColormap,
      isLoading: false,
      rangeInfo: {},
      requiresApply: false,
    };

    this.onApplyFusion = this.onApplyFusion.bind(this);
    this.onActiveScanChange = this.onActiveScanChange.bind(this);
    this.onColormapChanged = this.onColormapChanged.bind(this);
    this.onOpacityChanged = this.onOpacityChanged.bind(this);
    this.onIntensityRangeChanged = this.onIntensityRangeChanged.bind(this);
    this.onOpacityRangeChanged = this.onOpacityRangeChanged.bind(this);
    this.onLoadedVolumeData = this.onLoadedVolumeData.bind(this);
  }

  componentDidMount() {
    const { viewportSpecificData, isVTK } = this.props;

    const { validOverlayDisplaySets, imageFusionData } = viewportSpecificData;
    const _imageFusionData = imageFusionData || {
      ...DEFAULT_FUSION_DATA,
      colormap: this.contextColormaps.defaultColormap,
    };
    const updatedLayerList = this.getLayerList(validOverlayDisplaySets);

    const newState = { layerList: updatedLayerList, ..._imageFusionData };

    if (isVTK) {
      const volumeData = commandsManager.runCommand('getVolumeLoadedData', {
        displaySetInstanceUID: _imageFusionData.displaySetInstanceUID,
      });
      if (!volumeData) {
        newState.rangeInfo = {};
      } else {
        newState.rangeInfo = volumeData.rangeInfo;
      }
    }

    this.setState(newState);
  }

  componentDidUpdate(prevProps, prevState) {
    const { viewportSpecificData, activeViewportIndex } = this.props;
    const { validOverlayDisplaySets, imageFusionData } = viewportSpecificData;
    const _imageFusionData = imageFusionData || {
      ...DEFAULT_FUSION_DATA,
      colormap: this.contextColormaps.defaultColormap,
    };

    const {
      viewportSpecificData: prevViewportSpecificData,
      activeViewportIndex: prevActiveViewportIndex,
    } = prevProps;
    const { imageFusionData: prevImageFusionData } = prevViewportSpecificData;

    this.prevDisplaySetInstanceUID = prevState.displaySetInstanceUID;

    if (activeViewportIndex !== prevActiveViewportIndex) {
      const updatedLayerList = this.getLayerList(validOverlayDisplaySets);
      this.setState({ layerList: updatedLayerList, ..._imageFusionData });
    } else if (
      !isEqual(_imageFusionData, prevImageFusionData) &&
      isEqual(prevState, this.state)
    ) {
      this.setState({ ..._imageFusionData });
    }
  }

  updateStore(updatedImageFusionData) {
    const { activeViewportIndex, setViewportFusionData } = this.props;

    const {
      StudyInstanceUID,
      displaySetInstanceUID,
      opacity,
      colormap,
      visible,
    } = this.state;

    const imageFusionData = {
      displaySetInstanceUID:
        updatedImageFusionData.displaySetInstanceUID || displaySetInstanceUID,
      opacity: updatedImageFusionData.opacity || opacity,
      colormap: updatedImageFusionData.colormap || colormap,
      visible: updatedImageFusionData.visible || visible,
      StudyInstanceUID,
      onLoadedVolumeData: updatedImageFusionData.onLoadedVolumeData,
    };

    setViewportFusionData(activeViewportIndex, imageFusionData);
  }

  getLayerList(validOverlayDisplaySets) {
    const { layerList } = this.state;

    const updatedLayerList = layerList.slice(0, 1);
    Object.keys(validOverlayDisplaySets).forEach(key => {
      const study = studyMetadataManager.get(key);
      const {
        StudyInstanceUID,
        StudyDescription,
        displaySets,
      } = study.getData();
      const validDisplayInstanceUIDs = validOverlayDisplaySets[key];
      const validDisplaySets = displaySets.filter(ds =>
        validDisplayInstanceUIDs.includes(ds.displaySetInstanceUID)
      );
      const studyLayerList = {
        StudyInstanceUID,
        StudyDescription,
        layers: [],
      };
      validDisplaySets.forEach(ds => {
        studyLayerList.layers.push({
          displaySetInstanceUID: ds.displaySetInstanceUID,
          SeriesInstanceUID: ds.SeriesInstanceUID,
          Modality: ds.Modality,
          SeriesNumber: ds.SeriesNumber,
          SeriesDescription: ds.SeriesDescription,
          StudyInstanceUID: StudyInstanceUID,
        });
      });
      updatedLayerList.push(studyLayerList);
    });

    return updatedLayerList;
  }

  onLoadedVolumeData(displaySetInstanceUID) {
    const volumeData = commandsManager.runCommand('getVolumeLoadedData', {
      displaySetInstanceUID,
    });
    this.setState({ isLoading: false, rangeInfo: volumeData.rangeInfo });
  }

  onActiveScanChange(evt) {
    const { isVTK } = this.props;
    const target = evt.target;
    const displaySetInstanceUID = target.value;
    const StudyInstanceUID = target.selectedOptions[0].dataset.studyuid;

    const newState = {
      displaySetInstanceUID,
      StudyInstanceUID,
      requiresApply: true,
    };

    if (isVTK) {
      // Get range information
      const volumeData = commandsManager.runCommand('getVolumeLoadedData', {
        displaySetInstanceUID,
      });
      if (!volumeData) {
        newState.rangeInfo = {};
      } else {
        newState.rangeInfo = volumeData.rangeInfo;
      }
    }

    this.setState(newState);
  }

  async onApplyFusion() {
    const { isVTK } = this.props;
    const { displaySetInstanceUID, StudyInstanceUID } = this.state;

    const newState = {
      rangeInfo: {},
      requiresApply: false,
    };

    if (displaySetInstanceUID !== this.prevDisplaySetInstanceUID) {
      let onLoadedVolumeData;
      if (displaySetInstanceUID !== 'none') {
        // Make sure the first image is loaded
        const study = studyMetadataManager.get(StudyInstanceUID);

        const displaySet = study.displaySets.find(set => {
          return set.displaySetInstanceUID === displaySetInstanceUID;
        });

        // Get stack from Stack Manager
        const storedStack = StackManager.findOrCreateStack(study, displaySet);
        const firstImageId = storedStack.imageIds[0];
        if (!(firstImageId in cornerstone.imageCache.imageCache)) {
          await cornerstone.loadAndCacheImage(firstImageId);
        }

        if (isVTK) {
          // Has the volume loaded before?
          const volumeData = commandsManager.runCommand('getVolumeLoadedData', {
            displaySetInstanceUID,
          });
          if (!volumeData) {
            onLoadedVolumeData = this.onLoadedVolumeData;
            newState.isLoading = true;
          } else {
            newState.rangeInfo = volumeData.rangeInfo;
          }
        }
      }

      this.setState(newState);

      this.updateStore({ displaySetInstanceUID, onLoadedVolumeData });
    }
  }

  onColormapChanged(evt) {
    const { isVTK } = this.props;
    const { displaySetInstanceUID, rangeInfo } = this.state;

    const colormap = evt.target.value;

    if (isVTK) {
      const { user, opacity } = rangeInfo;
      commandsManager.runCommand('updateVolumeColorAndOpacityRange', {
        displaySetInstanceUID,
        colormap,
        userRange: { ...user },
        opacity: [...opacity],
      });
    }

    this.updateStore({ colormap });
  }

  onOpacityChanged(value) {
    const opacity = parseFloat(value) / 100;

    this.updateStore({ opacity: opacity });
  }

  onIntensityRangeChanged(valueArray) {
    const { isVTK } = this.props;
    const { displaySetInstanceUID, colormap, rangeInfo } = this.state;

    if (isVTK) {
      const volumeData = commandsManager.runCommand(
        'updateVolumeColorAndOpacityRange',
        {
          displaySetInstanceUID,
          colormap,
          userRange: {
            lower: valueArray[0],
            middle: valueArray[1],
            upper: valueArray[2],
          },
          opacity: rangeInfo.opacity,
        }
      );
      const newRangeInfo = volumeData.rangeInfo || {};

      this.setState({ rangeInfo: newRangeInfo });
    }
  }

  onOpacityRangeChanged(valueArray) {
    const { isVTK } = this.props;
    const { displaySetInstanceUID, colormap, rangeInfo } = this.state;

    if (isVTK) {
      const volumeData = commandsManager.runCommand(
        'updateVolumeColorAndOpacityRange',
        {
          displaySetInstanceUID,
          colormap,
          userRange: rangeInfo.user,
          opacity: valueArray,
        }
      );
      const newRangeInfo = volumeData.rangeInfo || {};

      this.setState({ rangeInfo: newRangeInfo });
    }
  }

  render() {
    const { onClose, isVTK } = this.props;
    const {
      layerList,
      displaySetInstanceUID,
      StudyInstanceUID,
      opacity,
      colormap,
      visible,
      isLoading,
      rangeInfo,
      requiresApply,
    } = this.state;

    const getLayerValue = ds => {
      return `${ds.Modality} ${
        ds.SeriesNumber ? `(Ser ${ds.SeriesNumber}) ` : ''
      } ${ds.SeriesDescription}`;
    };

    const modality = _getModality({ StudyInstanceUID, displaySetInstanceUID });

    const scanList = (
      <select value={displaySetInstanceUID} onChange={this.onActiveScanChange}>
        {layerList.map((study, studyIndex) => {
          if (!study.layers) {
            return (
              <option
                key={studyIndex}
                value={study.displaySetInstanceUID}
                data-studyuid=""
              >
                {study.SeriesDescription}
              </option>
            );
          }
          return (
            <optgroup
              key={studyIndex}
              label={
                study.StudyDescription
                  ? study.StudyDescription
                  : study.StudyInstanceUID
              }
            >
              {study.layers.map((ds, index) => {
                return (
                  <option
                    key={index}
                    value={ds.displaySetInstanceUID}
                    data-studyuid={ds.StudyInstanceUID}
                  >
                    {getLayerValue(ds)}
                  </option>
                );
              })}
            </optgroup>
          );
        })}
      </select>
    );

    let className = 'ImageFusionDialogContainer';
    if (isLoading) {
      className += ' isLoading';
    }

    return (
      <div className={className}>
        {/*<div className="dialogHandle">*/}
        {/*  <Icon name="xnat-image-composition" width="26px" height="26px" />*/}
        {/*</div>*/}
        <div className="ImageFusionDialog">
          <div className="row">
            {scanList}
            <button
              className={`${requiresApply ? 'jump' : undefined}`}
              onClick={this.onApplyFusion}
            >
              Apply
            </button>
            <div className="verticalLine" />
            <div className="group">
              <Icon name="xnat-colormap" width="18px" height="18px" />
              <select value={colormap} onChange={this.onColormapChanged}>
                {this.contextColormaps.colormapList.map(color => (
                  <option key={color.id} value={color.id}>
                    {color.name}
                  </option>
                ))}
              </select>
            </div>
            {!isVTK && (
              <div className="group">
                <Icon name="xnat-opacity" width="22px" height="22px" />
                <CSOpacityRange
                  opacity={opacity}
                  onOpacityChanged={this.onOpacityChanged}
                />
              </div>
            )}
          </div>

          {isVTK && !isEmpty(rangeInfo) && (
            <>
              <div className="row">
                <div className="group">
                  <Icon name="xnat-contrast-range" width="22px" height="22px" />
                  <VTKIntensityRange
                    rangeInfo={rangeInfo}
                    onIntensityRangeChanged={this.onIntensityRangeChanged}
                    modality={modality}
                  />
                </div>
              </div>
              <div className="row" style={{ marginBottom: 15 }}>
                <div className="group">
                  <Icon name="xnat-opacity" width="22px" height="22px" />
                  <VTKOpacityRange
                    rangeInfo={rangeInfo}
                    onOpacityRangeChanged={this.onOpacityRangeChanged}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
}

ImageFusionDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  isVTK: PropTypes.bool.isRequired,
  viewportSpecificData: PropTypes.object.isRequired,
  colormaps: PropTypes.object.isRequired,
  activeViewportIndex: PropTypes.number.isRequired,
  setViewportFusionData: PropTypes.func.isRequired,
};

export default ImageFusionDialog;
