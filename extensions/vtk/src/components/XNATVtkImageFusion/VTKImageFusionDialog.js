import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import OHIF from '@ohif/core';
import { Icon } from '@ohif/ui';
import { isEqual, isEmpty, cloneDeep } from 'lodash';
import vtkColorMaps from '../../utils/colorMaps/ColorMaps';
import volumeProperties from '../../utils/volumeProperties';
import VTKWindowLevelRange from './VTKWindowLevelRange';
import VTKOpacityRange from './VTKOpacityRange';

import './VTKImageFusionDialog.styl';

const { studyMetadataManager, StackManager } = OHIF.utils;

const _getModality = ({ StudyInstanceUID, displaySetInstanceUID }) => {
  if (!StudyInstanceUID || displaySetInstanceUID === 'none') {
    return;
  }
  const studies = studyMetadataManager.all();
  const studyMetadata = studies.find(
    study =>
      study.getStudyInstanceUID() === StudyInstanceUID &&
      study.displaySets.some(
        ds => ds.displaySetInstanceUID === displaySetInstanceUID
      )
  );
  const displaySet = studyMetadata.findDisplaySet(
    displaySet => displaySet.displaySetInstanceUID === displaySetInstanceUID
  );
  if (displaySet) {
    return displaySet.Modality;
  }
};

class VTKImageFusionDialog extends PureComponent {
  constructor(props) {
    super(props);

    const layerList = [
      {
        displaySetInstanceUID: 'none',
        SeriesDescription: 'Select fusion image',
      },
    ];

    this.colormapList = vtkColorMaps.rgbPresetNames.map((name, index) => ({
      id: name,
      name,
    }));

    this.state = {
      layerList: layerList,
      // Composition data
      StudyInstanceUID: '',
      displaySetInstanceUID: 'none',
      colormap: vtkColorMaps.defaultForegroundColormap,
      isLoading: false,
      vtkProperties: {},
      requiresApply: false,
    };

    this.onApplyFusion = this.onApplyFusion.bind(this);
    this.onActiveScanChange = this.onActiveScanChange.bind(this);
    this.onToggleVisibility = this.onToggleVisibility.bind(this);
    this.onColormapChanged = this.onColormapChanged.bind(this);
    this.onOpacityChanged = this.onOpacityChanged.bind(this);
    this.onIntensityRangeChanged = this.onIntensityRangeChanged.bind(this);
    this.onColormapRescaleChanged = this.onColormapRescaleChanged.bind(this);
    this.onLoadedFusionData = this.onLoadedFusionData.bind(this);
  }

  componentDidMount() {
    const { viewportSpecificData } = this.props;

    const {
      validOverlayDisplaySets,
      vtkImageFusionData,
    } = viewportSpecificData;

    const _vtkImageFusionData = vtkImageFusionData || {
      StudyInstanceUID: '',
      displaySetInstanceUID: 'none',
    };
    const updatedLayerList = this.getLayerList(validOverlayDisplaySets);

    const newState = { layerList: updatedLayerList, ..._vtkImageFusionData };

    newState.vtkProperties =
      this.getVolumeProperties(_vtkImageFusionData.displaySetInstanceUID) || {};

    this.setState(newState);
  }

  componentDidUpdate(prevProps, prevState) {
    const { viewportSpecificData } = this.props;
    const {
      validOverlayDisplaySets,
      vtkImageFusionData,
    } = viewportSpecificData;

    const { viewportSpecificData: prevViewportSpecificData } = prevProps;
    const {
      vtkImageFusionData: prevVtkImageFusionData,
    } = prevViewportSpecificData;

    if (vtkImageFusionData && isEqual(prevState, this.state)) {
      const prevDisplaySetInstanceUID = prevVtkImageFusionData
        ? prevVtkImageFusionData.displaySetInstanceUID
        : 'none';
      const displaySetInstanceUID = vtkImageFusionData.displaySetInstanceUID;

      if (displaySetInstanceUID !== prevDisplaySetInstanceUID) {
        const updatedLayerList = this.getLayerList(validOverlayDisplaySets);
        this.setState({ layerList: updatedLayerList, ...vtkImageFusionData });
      }
    }
  }

  getVolumeProperties(displaySetInstanceUID) {
    const userProperties = volumeProperties.getProperties(
      displaySetInstanceUID,
      { source: 'user' }
    );

    if (userProperties) {
      return userProperties.fg;
    }
  }

  updateStore(updatedImageFusionData) {
    const { activeViewportIndex, setViewportFusionData } = this.props;

    const { StudyInstanceUID, displaySetInstanceUID } = this.state;

    const imageFusionData = {
      displaySetInstanceUID:
        updatedImageFusionData.displaySetInstanceUID || displaySetInstanceUID,
      StudyInstanceUID,
      onLoadedFusionData: updatedImageFusionData.onLoadedFusionData,
    };

    setViewportFusionData(activeViewportIndex, imageFusionData);
  }

  updateVtkViewportApi() {
    this.props.commandsManager.runCommand('updateVtkApi');
  }

  getLayerList(validOverlayDisplaySets) {
    const { layerList } = this.state;

    const studies = studyMetadataManager.all();

    const updatedLayerList = layerList.slice(0, 1);
    Object.keys(validOverlayDisplaySets).forEach(key => {
      const studyKey = key.split('_')[0];
      const validDisplayInstanceUIDs = validOverlayDisplaySets[key];
      const study = studies.find(
        study =>
          study.getStudyInstanceUID() === studyKey &&
          study.displaySets.some(
            ds => ds.displaySetInstanceUID === validDisplayInstanceUIDs[0]
          )
      );
      const {
        StudyInstanceUID,
        StudyDescription,
        displaySets,
      } = study.getData();
      const validDisplaySets = displaySets.filter(ds =>
        validDisplayInstanceUIDs.includes(ds.displaySetInstanceUID)
      );
      const studyLayerList = {
        StudyInstanceUID,
        StudyDescription,
        layers: [],
      };
      validDisplaySets.forEach(ds => {
        if (ds.isReconstructable) {
          studyLayerList.layers.push({
            displaySetInstanceUID: ds.displaySetInstanceUID,
            SeriesInstanceUID: ds.SeriesInstanceUID,
            Modality: ds.Modality,
            SeriesNumber: ds.SeriesNumber,
            SeriesDescription: ds.SeriesDescription,
            StudyInstanceUID: StudyInstanceUID,
          });
        }
      });
      updatedLayerList.push(studyLayerList);
    });

    return updatedLayerList;
  }

  onLoadedFusionData(displaySetInstanceUID) {
    const vtkProperties = this.getVolumeProperties(displaySetInstanceUID);
    this.setState({ isLoading: false, vtkProperties: vtkProperties });
  }

  onActiveScanChange(evt) {
    const target = evt.target;
    const displaySetInstanceUID = target.value;
    const StudyInstanceUID = target.selectedOptions[0].dataset.studyuid;

    const isInitialized = volumeProperties.isInitialized(displaySetInstanceUID);
    if (isInitialized) {
      this.setState({ displaySetInstanceUID, StudyInstanceUID }, () =>
        this.onApplyFusion()
      );
      return;
    }

    const newState = {
      displaySetInstanceUID,
      StudyInstanceUID,
      requiresApply: !isInitialized,
    };

    const vtkProperties = this.getVolumeProperties(displaySetInstanceUID);
    if (!vtkProperties) {
      newState.vtkProperties = {};
    } else {
      newState.vtkProperties = vtkProperties;
    }

    this.setState(newState);
  }

  async onApplyFusion() {
    const { displaySetInstanceUID, StudyInstanceUID } = this.state;

    const newState = {
      vtkProperties: {},
      requiresApply: false,
    };

    {
      let onLoadedFusionData;
      if (displaySetInstanceUID !== 'none') {
        // Make sure the first image is loaded
        const studies = studyMetadataManager.all();
        const study = studies.find(
          study =>
            study.getStudyInstanceUID() === StudyInstanceUID &&
            study.displaySets.some(
              ds => ds.displaySetInstanceUID === displaySetInstanceUID
            )
        );

        const displaySet = study.displaySets.find(set => {
          return set.displaySetInstanceUID === displaySetInstanceUID;
        });

        // Get stack from Stack Manager
        const storedStack = StackManager.findOrCreateStack(study, displaySet);
        const firstImageId = storedStack.imageIds[0];
        if (!(firstImageId in cornerstone.imageCache.imageCache)) {
          await cornerstone.loadAndCacheImage(firstImageId);
        }

        // Has the volume been loaded before?
        const vtkProperties = this.getVolumeProperties(displaySetInstanceUID);
        if (!vtkProperties) {
          onLoadedFusionData = this.onLoadedFusionData;
          newState.isLoading = true;
        } else {
          newState.vtkProperties = vtkProperties;
        }
      }

      this.setState(newState);

      this.updateStore({ displaySetInstanceUID, onLoadedFusionData });
    }
  }

  onToggleVisibility() {
    const { displaySetInstanceUID, vtkProperties } = this.state;

    volumeProperties.updateUserProperties(displaySetInstanceUID, {
      fg: {
        visible: !vtkProperties.visible,
      },
    });
    volumeProperties.applyUserPropertiesToVolume(displaySetInstanceUID, true);
    this.updateVtkViewportApi();
    this.setState({
      vtkProperties: this.getVolumeProperties(displaySetInstanceUID) || {},
    });
  }

  onColormapChanged(evt) {
    const { displaySetInstanceUID } = this.state;

    const colormap = evt.target.value;

    volumeProperties.updateUserProperties(displaySetInstanceUID, {
      fg: {
        colormap,
      },
    });
    volumeProperties.applyUserPropertiesToVolume(displaySetInstanceUID, true);
    this.updateVtkViewportApi();
    const vtkProperties = this.getVolumeProperties(displaySetInstanceUID) || {};
    this.setState({ vtkProperties });
  }

  onOpacityChanged(value) {
    const { displaySetInstanceUID } = this.state;
    const opacity = parseFloat(value) / 100;

    volumeProperties.updateUserProperties(displaySetInstanceUID, {
      fg: {
        globalOpacity: opacity,
      },
    });
    volumeProperties.applyUserPropertiesToVolume(displaySetInstanceUID, true);
    this.updateVtkViewportApi();
    const vtkProperties = this.getVolumeProperties(displaySetInstanceUID) || {};
    this.setState({ vtkProperties });
  }

  onIntensityRangeChanged(valueRange) {
    const { displaySetInstanceUID } = this.state;

    volumeProperties.updateUserProperties(displaySetInstanceUID, {
      fg: {
        voiRange: [...valueRange],
      },
    });
    volumeProperties.applyUserPropertiesToVolume(displaySetInstanceUID, true);
    this.updateVtkViewportApi();
    const newVtkProperties =
      this.getVolumeProperties(displaySetInstanceUID) || {};
    this.setState({ vtkProperties: newVtkProperties });
  }

  onColormapRescaleChanged(evt) {
    const value = evt.target.value;
    const rescaleColormap = value === '1';

    const { displaySetInstanceUID } = this.state;

    volumeProperties.updateUserProperties(displaySetInstanceUID, {
      fg: {
        rescaleColormap: rescaleColormap,
      },
    });
    volumeProperties.applyUserPropertiesToVolume(displaySetInstanceUID, true);
    this.updateVtkViewportApi();
    const newVtkProperties =
      this.getVolumeProperties(displaySetInstanceUID) || {};
    this.setState({ vtkProperties: newVtkProperties });
  }

  render() {
    const { onClose } = this.props;
    const {
      layerList,
      displaySetInstanceUID,
      StudyInstanceUID,
      isLoading,
      vtkProperties,
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

    let className = 'VtkImageFusionDialogContainer';
    if (isLoading) {
      className += ' isLoading';
    }

    return (
      <div className={className}>
        <div className="VtkImageFusionDialog">
          <div className="header">
            <Icon name="xnat-image-composition" />
          </div>
          <div className="row">
            {scanList}

            {isEmpty(vtkProperties) && displaySetInstanceUID !== 'none' && (
              <button
                className={`${requiresApply ? 'jump' : ''}`}
                onClick={this.onApplyFusion}
              >
                Load Image
              </button>
            )}

            {!isEmpty(vtkProperties) && (
              <>
                {/*<div className="verticalLine" />*/}
                {/*<div className="group">*/}
                {/*  <Icon name="xnat-colormap" width="18px" height="18px" />*/}
                {/*  <select*/}
                {/*    value={vtkProperties.colormap}*/}
                {/*    onChange={this.onColormapChanged}*/}
                {/*  >*/}
                {/*    {this.colormapList.map(color => (*/}
                {/*      <option key={color.id} value={color.id}>*/}
                {/*        {color.name}*/}
                {/*      </option>*/}
                {/*    ))}*/}
                {/*  </select>*/}
                {/*</div>*/}
                <div className="group">
                  <Icon
                    name={vtkProperties.visible ? 'eye' : 'eye-closed'}
                    className={`visibility ${!vtkProperties.visible &&
                      'invisible'}`}
                    width="22px"
                    height="22px"
                    onClick={event => this.onToggleVisibility()}
                  />
                </div>
              </>
            )}
          </div>

          {!isEmpty(vtkProperties) && (
            <>
              <div
                className="row"
                style={{ maxWidth: 360, marginTop: 10, marginBottom: 5 }}
              >
                <div className="group">
                  <Icon name="xnat-colormap" width="18px" height="18px" />
                  <select
                    value={vtkProperties.colormap}
                    onChange={this.onColormapChanged}
                  >
                    {this.colormapList.map(color => (
                      <option key={color.id} value={color.id}>
                        {color.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="group">
                  <select
                    value={vtkProperties.rescaleColormap ? '1' : '0'}
                    onChange={this.onColormapRescaleChanged}
                  >
                    <option value="1">Rescale Colormap</option>
                    <option value="0">Use Full Data Range</option>
                  </select>
                </div>
              </div>
              <div className="row">
                <div className="group" style={{ alignItems: 'flex-end' }}>
                  <Icon name="xnat-contrast-range" width="22px" height="22px" />
                  <VTKWindowLevelRange
                    rangeInfo={{
                      voiRange: vtkProperties.voiRange,
                      dataRange: vtkProperties.dataRange,
                    }}
                    onIntensityRangeChanged={this.onIntensityRangeChanged}
                    modality={modality}
                    displaySetInstanceUID={displaySetInstanceUID}
                  />
                </div>
              </div>
              <div className="row" style={{ marginTop: 15, marginBottom: 15 }}>
                <div className="group">
                  <Icon name="xnat-opacity" width="22px" height="22px" />
                  <VTKOpacityRange
                    opacity={vtkProperties.globalOpacity}
                    onOpacityChanged={this.onOpacityChanged}
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

VTKImageFusionDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  viewportSpecificData: PropTypes.object.isRequired,
  activeViewportIndex: PropTypes.number.isRequired,
  setViewportFusionData: PropTypes.func.isRequired,
  commandsManager: PropTypes.object,
};

export default VTKImageFusionDialog;
