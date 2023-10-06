import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import throttle from 'lodash.throttle';
import cornerstone from 'cornerstone-core';
import OHIF from '@ohif/core';
import { Icon, Range } from '@ohif/ui';
import imageFusionManager from '../api/ImageFusionManager';

import './ImageFusionDialog.styl';

const { studyMetadataManager } = OHIF.utils;

class ImageFusionDialog extends PureComponent {
  constructor(props) {
    super(props);

    this.colormapList = imageFusionManager.getColormapList();

    const { viewportSpecificData } = props;
    const { validOverlayDisplaySets } = viewportSpecificData;
    const layerList = this.getLayerList(validOverlayDisplaySets);

    this.state = {
      layerList,
    };

    this.onApplyFusion = this.onApplyFusion.bind(this);
    this.onActiveScanChange = this.onActiveScanChange.bind(this);
    this.onColormapChanged = this.onColormapChanged.bind(this);
    this.onOpacityChanged = this.onOpacityChanged.bind(this);
    this.updateFusionLayer = this.updateFusionLayer.bind(this);

    this.throttledOnOpacityChanged = throttle(this.onOpacityChanged, 100);
  }

  componentDidMount() {}

  componentDidUpdate(prevProps, prevState) {
    const { activeViewportIndex, viewportSpecificData } = this.props;
    const {
      displaySetInstanceUID,
      validOverlayDisplaySets,
      imageFusionData,
    } = viewportSpecificData;

    const {
      activeViewportIndex: prevActiveViewportIndex,
      viewportSpecificData: prevViewportSpecificData,
    } = prevProps;
    const {
      displaySetInstanceUID: prevDisplaySetInstanceUID,
      imageFusionData: prevImageFusionData,
    } = prevViewportSpecificData;

    if (
      activeViewportIndex !== prevActiveViewportIndex ||
      displaySetInstanceUID !== prevDisplaySetInstanceUID
    ) {
      const layerList = this.getLayerList(validOverlayDisplaySets);
      this.setState({ layerList });
    } else {
      if (imageFusionData.fusionActive && !prevImageFusionData.fusionActive) {
        const enabledElement = cornerstone.getEnabledElements()[
          activeViewportIndex
        ];
        imageFusionManager.applyFusion(imageFusionData, enabledElement);
      } else if (
        !imageFusionData.fusionActive &&
        prevImageFusionData.fusionActive
      ) {
        const enabledElement = cornerstone.getEnabledElements()[
          activeViewportIndex
        ];
        imageFusionManager.reset(enabledElement);
      }
    }
  }

  updateStore(updatedFusionParameters) {
    const {
      activeViewportIndex,
      viewportSpecificData,
      setViewportFusionData,
    } = this.props;
    const { imageFusionData } = viewportSpecificData;

    setViewportFusionData(activeViewportIndex, {
      ...imageFusionData,
      ...updatedFusionParameters,
    });
  }

  getLayerList(validOverlayDisplaySets) {
    const updatedLayerList = [];

    // Add an empty entry to the list
    updatedLayerList.push({
      displaySetInstanceUID: 'none',
      SeriesDescription: 'Select fusion image',
    });

    const studies = studyMetadataManager.all();

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
        if (ds.isReconstructable || ds.isEnhanced) {
          let isColor = false;
          const firstImage = ds.getImage(0);
          if (firstImage) {
            const metadata = firstImage.getData().metadata;
            if (
              metadata.PhotometricInterpretation === 'RGB' ||
              metadata.SamplesPerPixel === 3
            ) {
              isColor = true;
            }
          }

          studyLayerList.layers.push({
            displaySetInstanceUID: ds.displaySetInstanceUID,
            SeriesInstanceUID: ds.SeriesInstanceUID,
            Modality: ds.Modality,
            SeriesNumber: ds.SeriesNumber,
            SeriesDescription: ds.SeriesDescription,
            StudyInstanceUID: StudyInstanceUID,
            isColor,
          });
        }
      });
      updatedLayerList.push(studyLayerList);
    });

    return updatedLayerList;
  }

  updateFusionLayer(fusionParameters) {
    const { activeViewportIndex } = this.props;
    const enabledElement = cornerstone.getEnabledElements()[
      activeViewportIndex
    ];

    imageFusionManager.updateFusionLayer(fusionParameters, enabledElement);
  }

  onActiveScanChange(evt) {
    const { viewportSpecificData } = this.props;
    const { imageFusionData } = viewportSpecificData;

    const target = evt.target;
    const displaySetInstanceUID = target.value;
    const targetDataset = target.selectedOptions[0].dataset;
    const StudyInstanceUID = targetDataset.studyuid;
    const isColor = targetDataset.iscolor === 'true';
    const seriesNumber = targetDataset.seriesnumber || '';

    const fusionDescription = `Fusion: Ser-${seriesNumber}`;
    let colormapName = '';
    if (!isColor) {
      const colormap = this.colormapList.find(group => {
        return group.colormaps.find(
          color => color.id === imageFusionData.colormap
        );
      });
      colormapName = colormap && colormap.name ? colormap.name : '';
    }

    this.updateStore({
      displaySetInstanceUID,
      StudyInstanceUID,
      isColor,
      fusionDescription,
      colormapName,
    });
  }

  async onApplyFusion() {
    const { viewportSpecificData } = this.props;
    const { imageFusionData } = viewportSpecificData;

    this.updateStore({
      fusionActive: !imageFusionData.fusionActive,
    });
  }

  onColormapChanged(evt) {
    const colormap = evt.target.value;

    this.updateFusionLayer({ colormap });

    const colormapObj = this.colormapList.find(group => {
      return group.colormaps.find(color => color.id === colormap);
    });

    const colormapName =
      colormapObj && colormapObj.name ? colormapObj.name : '';

    this.updateStore({ colormap, colormapName });
  }

  onOpacityChanged(evt) {
    const value = evt.target.value;
    const opacity = parseFloat(value) / 100;

    this.updateFusionLayer({ opacity });

    this.updateStore({ opacity });
  }

  render() {
    const { viewportSpecificData } = this.props;
    const { imageFusionData } = viewportSpecificData;
    const { layerList } = this.state;

    const {
      displaySetInstanceUID,
      colormap,
      opacity,
      fusionActive,
      isColor,
    } = imageFusionData;

    if (layerList.length < 2) {
      return (
        <div className="ImageFusionDialogContainer">
          <div className="ImageFusionDialog">
            <h5>Image Fusion</h5>
            <div className="row">No valid fusion scans.</div>
          </div>
        </div>
      );
    }

    // Update rendering content of the layer list
    const layerListContent = (
      <select
        value={displaySetInstanceUID}
        onChange={this.onActiveScanChange}
        style={{ width: 260 }}
        disabled={fusionActive}
      >
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
                    data-iscolor={ds.isColor}
                    data-seriesnumber={ds.SeriesNumber}
                  >
                    {generateLayerEntryInfo(ds)}
                  </option>
                );
              })}
            </optgroup>
          );
        })}
      </select>
    );

    return (
      <div className="ImageFusionDialogContainer">
        <div className="ImageFusionDialog">
          <h5>Image Fusion</h5>
          <div className="row">
            {layerListContent}
            {displaySetInstanceUID !== 'none' && (
              <button onClick={this.onApplyFusion}>
                {fusionActive ? 'Remove' : 'Apply'}
              </button>
            )}
          </div>
          {fusionActive && (
            <div className="row">
              {!isColor && (
                <div className="group">
                  <Icon name="xnat-colormap" width="18px" height="18px"/>
                  <select value={colormap} onChange={this.onColormapChanged}>
                    {this.colormapList.map((group, groupIndex) => (
                      <optgroup key={groupIndex} label={group.description}>
                        {group.colormaps.map(color => (
                          <option key={color.id} value={color.id}>
                            {color.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              )}
              <div className={`group${isColor ? ' fullWidth' : ''}`}>
                <Icon name="xnat-opacity" width="22px" height="22px" />
                <Range
                  value={Number((opacity * 100).toFixed(0))}
                  showValue
                  step={1}
                  min={0}
                  max={100}
                  valueRenderer={value => (
                    <span className="opacityValue">{`${value}%`}</span>
                  )}
                  onChange={evt => {
                    evt.persist();
                    this.throttledOnOpacityChanged(evt);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

ImageFusionDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  viewportSpecificData: PropTypes.object.isRequired,
  activeViewportIndex: PropTypes.number.isRequired,
  setViewportFusionData: PropTypes.func.isRequired,
  commandsManager: PropTypes.object,
};

const generateLayerEntryInfo = ds => {
  return `${ds.Modality} ${
    ds.SeriesNumber ? `(Ser ${ds.SeriesNumber}) ` : ''
  } ${ds.SeriesDescription}`;
};

export default ImageFusionDialog;
