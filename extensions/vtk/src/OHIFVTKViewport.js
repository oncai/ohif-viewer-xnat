/* eslint-disable no-console */
import React, { Component } from 'react';
import { loadImageData, getImageData } from 'react-vtkjs-viewport';
import ConnectedVTKViewport from './ConnectedVTKViewport';
import LoadingIndicator from './LoadingIndicator.js';
import OHIF from '@ohif/core';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import { volumeCache, labelmapCache } from './utils/viewportDataCache';
import { DEFAULT_MODALITY_RANGE } from './utils/constants';
import volumeProperties from './utils/volumeProperties';

const segmentationModule = cornerstoneTools.getModule('segmentation');

const { StackManager, studyMetadataManager } = OHIF.utils;

// TODO: Figure out where we plan to put this long term

/**
 * Create a labelmap image with the same dimensions as our background volume.
 *
 * @param backgroundImageData vtkImageData
 */
/* TODO: Not currently used until we have drawing tools in vtkjs.
function createLabelMapImageData(backgroundImageData) {
  // TODO => Need to do something like this if we start drawing a new segmentation
  // On a vtkjs viewport.

  const labelMapData = vtkImageData.newInstance(
    backgroundImageData.get('spacing', 'origin', 'direction')
  );
  labelMapData.setDimensions(backgroundImageData.getDimensions());
  labelMapData.computeTransforms();

  const values = new Uint8Array(backgroundImageData.getNumberOfPoints());
  const dataArray = vtkDataArray.newInstance({
    numberOfComponents: 1, // labelmap with single component
    values,
  });
  labelMapData.getPointData().setScalars(dataArray);

  return labelMapData;
} */

class OHIFVTKViewport extends Component {
  state = {
    volumes: null,
    paintFilterLabelMapImageData: null,
    paintFilterBackgroundImageData: null,
    percentComplete: 0,
    isLoaded: false,
    fusionPercentComplete: 0,
    fusionIsLoaded: false,
  };

  static propTypes = {
    viewportData: PropTypes.shape({
      studies: PropTypes.array.isRequired,
      displaySet: PropTypes.shape({
        StudyInstanceUID: PropTypes.string.isRequired,
        displaySetInstanceUID: PropTypes.string.isRequired,
        sopClassUIDs: PropTypes.arrayOf(PropTypes.string),
        SOPInstanceUID: PropTypes.string,
        frameIndex: PropTypes.number,
        vtkImageFusionData: PropTypes.object,
      }),
    }),
    viewportIndex: PropTypes.number.isRequired,
    children: PropTypes.node,
    onScroll: PropTypes.func,
    servicesManager: PropTypes.object.isRequired,
    commandsManager: PropTypes.object.isRequired,
  };

  static defaultProps = {
    onScroll: () => {},
  };

  static id = 'OHIFVTKViewport';

  static init() {
    console.log('OHIFVTKViewport init()');
  }

  static destroy() {
    console.log('OHIFVTKViewport destroy()');
    StackManager.clearStacks();
  }

  static getCornerstoneStack(
    studies,
    StudyInstanceUID,
    displaySetInstanceUID,
    SOPClassUID,
    SOPInstanceUID,
    frameIndex
  ) {
    // Create shortcut to displaySet
    const study = studies.find(
      study =>
        study.StudyInstanceUID === StudyInstanceUID &&
        study.displaySets.some(
          ds => ds.displaySetInstanceUID === displaySetInstanceUID
        )
    );

    const displaySet = study.displaySets.find(set => {
      return set.displaySetInstanceUID === displaySetInstanceUID;
    });

    // Get stack from Stack Manager
    const storedStack = StackManager.findOrCreateStack(study, displaySet);

    // Clone the stack here so we don't mutate it
    const stack = Object.assign({}, storedStack);

    if (frameIndex !== undefined) {
      stack.currentImageIdIndex = frameIndex;
    } else if (SOPInstanceUID) {
      const index = stack.imageIds.findIndex(imageId => {
        const imageIdSOPInstanceUID = cornerstone.metaData.get(
          'SOPInstanceUID',
          imageId
        );

        return imageIdSOPInstanceUID === SOPInstanceUID;
      });

      if (index > -1) {
        stack.currentImageIdIndex = index;
      }
    } else {
      stack.currentImageIdIndex = 0;
    }

    return stack;
  }

  getViewportData = (
    studies,
    StudyInstanceUID,
    displaySetInstanceUID,
    SOPClassUID,
    SOPInstanceUID,
    frameIndex
  ) => {
    const { UINotificationService } = this.props.servicesManager.services;

    const stack = OHIFVTKViewport.getCornerstoneStack(
      studies,
      StudyInstanceUID,
      displaySetInstanceUID,
      SOPClassUID,
      SOPInstanceUID,
      frameIndex
    );

    const imageDataObject = getImageData(stack.imageIds, displaySetInstanceUID);
    imageDataObject.displaySetInstanceUID = displaySetInstanceUID;
    let labelmapDataObject;
    let labelmapColorLUT;

    const firstImageId = stack.imageIds[0];
    const { state } = segmentationModule;
    const brushStackState = state.series[firstImageId];

    if (brushStackState) {
      const { activeLabelmapIndex } = brushStackState;
      const labelmap3D = brushStackState.labelmaps3D[activeLabelmapIndex];

      if (
        brushStackState.labelmaps3D.length > 1 &&
        this.props.viewportIndex === 0
      ) {
        UINotificationService.show({
          title: 'Overlapping Segmentation Found',
          message:
            'Overlapping segmentations cannot be displayed when in MPR mode',
          type: 'info',
        });
      }

      this.segmentsDefaultProperties = labelmap3D.segmentsHidden.map(
        isHidden => {
          return { visible: !isHidden };
        }
      );

      const vtkLabelmapID = `${firstImageId}_${activeLabelmapIndex}`;

      labelmapDataObject = labelmapCache.get(vtkLabelmapID);
      if (!labelmapDataObject) {
        // TODO -> We need an imageId based getter in cornerstoneTools
        const labelmapBuffer = labelmap3D.buffer;

        // Create VTK Image Data with buffer as input
        labelmapDataObject = vtkImageData.newInstance();

        /*const dataArray = vtkDataArray.newInstance({
          numberOfComponents: 1, // labelmap with single component
          values: new Uint16Array(labelmapBuffer),
        });*/
        // TODO: Not a general solution - Only support for one fractional segment!
        // ======= Fork from master.  ========
        let dataArray;

        if (labelmap3D.isFractional) {
          // We need to set this or it will be crazy, as each color is a different segment.

          dataArray = vtkDataArray.newInstance({
            numberOfComponents: 1, // labelmap with single component
            values: new Uint8Array(labelmap3D.probabilityBuffer),
          });
        } else {
          dataArray = vtkDataArray.newInstance({
            numberOfComponents: 1, // labelmap with single component
            values: new Uint16Array(labelmapBuffer),
          });
        }
        // ======== End fork from master. ========

        labelmapDataObject.getPointData().setScalars(dataArray);
        labelmapDataObject.setDimensions(...imageDataObject.dimensions);
        labelmapDataObject.setSpacing(
          ...imageDataObject.vtkImageData.getSpacing()
        );
        // Fix labelmap origin & direction: imageDataObject origin is flipped in getImageData()
        const labelmapOrigin = imageDataObject.metaData0.imagePositionPatient;
        labelmapDataObject.setOrigin(
          // ...imageDataObject.vtkImageData.getOrigin()
          ...labelmapOrigin
        );
        const labelmapDirection = [
          ...imageDataObject.vtkImageData.getDirection(),
        ];
        labelmapDirection[6] = -labelmapDirection[6];
        labelmapDirection[7] = -labelmapDirection[7];
        labelmapDirection[8] = -labelmapDirection[8];
        labelmapDataObject.setDirection(
          // ...imageDataObject.vtkImageData.getDirection()
          ...labelmapDirection
        );

        // Cache the labelmap volume.
        labelmapCache.set(vtkLabelmapID, labelmapDataObject);
      }

      // labelmapColorLUT = state.colorLutTables[labelmap3D.colorLUTIndex];
      // TODO: Not a general solution - Only support for one fractional segment!
      // ======= Fork from master.  ========
      if (labelmap3D.isFractional) {
        if (
          Array.isArray(state.colorLutTables[labelmap3D.colorLUTIndex][1][0])
        ) {
          // Using a colormap, copy it.
          labelmapColorLUT = state.colorLutTables[labelmap3D.colorLUTIndex][1];
        } else {
          // Derive a colormap with 256 colors
          // TODO -> This doesn't work well as its volume rendering, so opacity layers and it saturates/
          // Shows you the incorrect value.
          labelmapColorLUT = [];
          const color = state.colorLutTables[labelmap3D.colorLUTIndex][1];

          for (let i = 0; i < 256; i++) {
            labelmapColorLUT.push([color[0], color[1], color[2], i]);
          }
        }
      } else {
        labelmapColorLUT = state.colorLutTables[labelmap3D.colorLUTIndex];
      }

      // ======== End fork from master. ========
    }

    return {
      imageDataObject,
      labelmapDataObject,
      labelmapColorLUT,
    };
  };

  getViewportFusionData = (studies, vtkImageFusionData) => {
    const {
      StudyInstanceUID,
      displaySetInstanceUID,
      onLoadedFusionData,
    } = vtkImageFusionData;

    const study = studies.find(
      study =>
        study.StudyInstanceUID === StudyInstanceUID &&
        study.displaySets.some(
          ds => ds.displaySetInstanceUID === displaySetInstanceUID
        )
    );
    const displaySet = study.displaySets.find(
      displaySet => displaySet.displaySetInstanceUID === displaySetInstanceUID
    );
    // const displaySet = study.displaySets.find(set => {
    //   return set.displaySetInstanceUID === displaySetInstanceUID;
    // });

    const { sopClassUIDs, SOPInstanceUID, frameIndex } = displaySet;
    if (sopClassUIDs.length > 1) {
      console.warn(
        'More than one SOPClassUID in the same series is not yet supported.'
      );
    }
    const SOPClassUID = sopClassUIDs[0] || undefined;

    const stack = OHIFVTKViewport.getCornerstoneStack(
      studies,
      StudyInstanceUID,
      displaySetInstanceUID,
      SOPClassUID,
      SOPInstanceUID,
      frameIndex
    );

    const imageDataObject = getImageData(stack.imageIds, displaySetInstanceUID);
    imageDataObject.displaySetInstanceUID = displaySetInstanceUID;
    imageDataObject.onLoadedFusionData = onLoadedFusionData;

    return imageDataObject;
  };

  /**
   *
   *
   * @param {object} imageDataObject
   * @param {object} imageDataObject.vtkImageData
   * @param {object} imageDataObject.imageMetaData0
   * @param {number} [imageDataObject.imageMetaData0.WindowWidth] - The volume's initial WindowWidth
   * @param {number} [imageDataObject.imageMetaData0.WindowCenter] - The volume's initial WindowCenter
   * @param {string} imageDataObject.imageMetaData0.Modality - CT, MR, PT, etc
   * @param {string} displaySetInstanceUID
   * @returns vtkVolumeActor
   * @memberof OHIFVTKViewport
   */
  getOrCreateVolume(imageDataObject, displaySetInstanceUID) {
    const { vtkImageData, imageMetaData0 } = imageDataObject;

    const cachedVolume = volumeCache.get(displaySetInstanceUID);
    if (cachedVolume) {
      return cachedVolume;
    }

    // TODO -> Should update react-vtkjs-viewport and react-cornerstone-viewports
    // internals to use naturalized DICOM JSON names.

    const {
      windowWidth: width,
      windowCenter: center,
      modality,
    } = imageMetaData0;

    const volumeActor = vtkVolume.newInstance();

    const volumeMapper = vtkVolumeMapper.newInstance();

    volumeActor.setMapper(volumeMapper);
    volumeMapper.setInputData(vtkImageData);

    const voi = _getRangeFromWindowLevels(width, center, modality);
    const voiRange = [voi.lower, voi.upper];

    const spacing = vtkImageData.getSpacing();
    // Set the sample distance to half the mean length of one side. This is where the divide by 6 comes from.
    // https://github.com/Kitware/VTK/blob/6b559c65bb90614fb02eb6d1b9e3f0fca3fe4b0b/Rendering/VolumeOpenGL2/vtkSmartVolumeMapper.cxx#L344
    // const sampleDistance = (spacing[0] + spacing[1] + spacing[2]) / 6;
    const sampleDistance =
      (parseFloat(spacing[0]) +
        parseFloat(spacing[1]) +
        // eslint-disable-next-line prettier/prettier
        parseFloat(spacing[2])) / 6;

    volumeMapper.setSampleDistance(sampleDistance);

    // Be generous to surpress warnings, as the logging really hurts performance.
    // TODO: maybe we should auto adjust samples to 1000.
    volumeMapper.setMaximumSamplesPerRay(4000);

    volumeCache.set(displaySetInstanceUID, volumeActor);

    volumeProperties.registerVolume(
      displaySetInstanceUID,
      volumeActor,
      voiRange
    );
    volumeProperties.setColorAndOpacityUsingVoi(volumeActor, voiRange);

    return volumeActor;
  }

  setStateFromProps() {
    const { studies, displaySet } = this.props.viewportData;
    const {
      StudyInstanceUID,
      displaySetInstanceUID,
      sopClassUIDs,
      SOPInstanceUID,
      frameIndex,
    } = displaySet;

    if (sopClassUIDs.length > 1) {
      console.warn(
        'More than one SOPClassUID in the same series is not yet supported.'
      );
    }
    const SOPClassUID = sopClassUIDs[0] || undefined;

    const study = studies.find(
      study =>
        study.StudyInstanceUID === StudyInstanceUID &&
        study.displaySets.some(
          ds => ds.displaySetInstanceUID === displaySetInstanceUID
        )
    );

    const dataDetails = this.getDataDetails(study, displaySet);

    try {
      const {
        imageDataObject,
        labelmapDataObject,
        labelmapColorLUT,
      } = this.getViewportData(
        studies,
        StudyInstanceUID,
        displaySetInstanceUID,
        SOPClassUID,
        SOPInstanceUID,
        frameIndex
      );
      imageDataObject.isFusionVolume = false;

      this.imageDataObject = imageDataObject;

      /* TODO: Not currently used until we have drawing tools in vtkjs.
      if (!labelmap) {
        labelmap = createLabelMapImageData(data);
      } */

      const volumeActor = this.getOrCreateVolume(
        imageDataObject,
        displaySetInstanceUID
      );

      const volumeActors = [volumeActor];

      // Image fusion pipeline
      let imageFusionDataObject;
      const vtkImageFusionData = displaySet.vtkImageFusionData;
      const fusionDisplaySetInstanceUID = vtkImageFusionData
        ? vtkImageFusionData.displaySetInstanceUID
        : 'none';

      let fusionIsLoaded = true;
      if (fusionDisplaySetInstanceUID !== 'none') {
        imageFusionDataObject = this.getViewportFusionData(
          studies,
          vtkImageFusionData
        );
        imageFusionDataObject.isFusionVolume = true;
        const fusionVolumeActor = this.getOrCreateVolume(
          imageFusionDataObject,
          vtkImageFusionData.displaySetInstanceUID
        );
        fusionVolumeActor
          .getMapper()
          .setBlendMode(volumeActor.getMapper().getBlendMode());
        volumeActors.push(fusionVolumeActor);
        fusionIsLoaded = false;
      }

      this.setState(
        {
          percentComplete: 0,
          fusionPercentComplete: 0,
          fusionIsLoaded,
          dataDetails,
        },
        () => {
          this.loadProgressively(
            imageDataObject,
            'percentComplete',
            'isLoaded'
          );
          if (imageFusionDataObject) {
            this.loadProgressively(
              imageFusionDataObject,
              'fusionPercentComplete',
              'fusionIsLoaded'
            );
          }

          // TODO: There must be a better way to do this.
          // We do this so that if all the data is available the react-vtkjs-viewport
          // Will render _something_ before the volumes are set and the volume
          // Construction that happens in react-vtkjs-viewport locks up the CPU.
          setTimeout(() => {
            this.setState({
              volumes: volumeActors,
              paintFilterLabelMapImageData: labelmapDataObject,
              paintFilterBackgroundImageData: imageDataObject.vtkImageData,
              labelmapColorLUT,
            });
          }, 200);
        }
      );
    } catch (error) {
      const errorTitle = 'Failed to load 2D MPR';
      console.error(errorTitle, error);
      const {
        UINotificationService,
        LoggerService,
      } = this.props.servicesManager.services;
      if (this.props.viewportIndex === 0) {
        const message = error.message.includes('buffer')
          ? 'Dataset is too big to display in MPR'
          : error.message;
        LoggerService.error({ error, message });
        UINotificationService.show({
          title: errorTitle,
          message,
          type: 'error',
          autoClose: false,
          action: {
            label: 'Exit 2D MPR',
            onClick: ({ close }) => {
              // context: 'ACTIVE_VIEWPORT::VTK',
              close();
              this.props.commandsManager.runCommand('setCornerstoneLayout');
            },
          },
        });
      }
      this.setState({ isLoaded: true });
    }
  }

  componentDidMount() {
    this.setStateFromProps();
  }

  componentDidUpdate(prevProps, prevState) {
    const { displaySet } = this.props.viewportData;
    const prevDisplaySet = prevProps.viewportData.displaySet;

    const vtkImageFusionData = displaySet.vtkImageFusionData;
    const fusionDisplaySetInstanceUID = vtkImageFusionData
      ? vtkImageFusionData.displaySetInstanceUID
      : 'none';
    const prevVtkImageFusionData = prevDisplaySet.vtkImageFusionData;
    const prevFusionDisplaySetInstanceUID = prevVtkImageFusionData
      ? prevVtkImageFusionData.displaySetInstanceUID
      : 'none';

    if (
      displaySet.displaySetInstanceUID !==
        prevDisplaySet.displaySetInstanceUID ||
      displaySet.SOPInstanceUID !== prevDisplaySet.SOPInstanceUID ||
      displaySet.frameIndex !== prevDisplaySet.frameIndex ||
      fusionDisplaySetInstanceUID !== prevFusionDisplaySetInstanceUID
    ) {
      this.setStateFromProps();
    }
  }

  updateVtkViewportApi() {
    this.props.commandsManager.runCommand('updateVtkApi', {
      viewportIndex: this.props.viewportIndex,
    });
  }

  loadProgressively(imageDataObject, percentCompleteTarget, isLoadedTarget) {
    loadImageData(imageDataObject);

    const {
      isLoading,
      imageIds,
      displaySetInstanceUID,
      onLoadedFusionData,
      isFusionVolume,
    } = imageDataObject;

    if (!isLoading) {
      this.setState({ [isLoadedTarget]: true });
      volumeProperties.applyUserPropertiesToVolume(
        displaySetInstanceUID,
        isFusionVolume
      );
      if (onLoadedFusionData && typeof onLoadedFusionData === 'function') {
        onLoadedFusionData(displaySetInstanceUID);
      }
      return;
    }

    const NumberOfFrames = imageIds.length;

    const onPixelDataInsertedCallback = numberProcessed => {
      const percentComplete = Math.floor(
        (numberProcessed * 100) / NumberOfFrames
      );

      if (percentComplete !== this.state[percentCompleteTarget]) {
        this.setState({
          [percentCompleteTarget]: percentComplete,
        });
        if (percentCompleteTarget === 'fusionPercentComplete') {
          // Update the API
          this.updateVtkViewportApi();
        }
      }
    };

    const onPixelDataInsertedErrorCallback = error => {
      const {
        UINotificationService,
        LoggerService,
      } = this.props.servicesManager.services;

      if (!this.hasError) {
        if (this.props.viewportIndex === 0) {
          // Only show the notification from one viewport 1 in MPR2D.
          LoggerService.error({ error, message: error.message });
          UINotificationService.show({
            title: 'MPR Load Error',
            message: error.message,
            type: 'error',
            autoClose: false,
          });
        }

        this.hasError = true;
      }
    };

    const onAllPixelDataInsertedCallback = () => {
      if (!volumeProperties.isInitialized(displaySetInstanceUID)) {
        volumeProperties.initVolume(displaySetInstanceUID);
        volumeProperties.applyUserPropertiesToVolume(
          displaySetInstanceUID,
          isFusionVolume
        );
        if (onLoadedFusionData && typeof onLoadedFusionData === 'function') {
          onLoadedFusionData(displaySetInstanceUID);
        }
      }
      // Update the API
      setTimeout(() => {
        this.updateVtkViewportApi();
      }, 300);
      this.setState({
        [isLoadedTarget]: true,
      });
    };

    imageDataObject.onPixelDataInserted(onPixelDataInsertedCallback);
    imageDataObject.onAllPixelDataInserted(onAllPixelDataInsertedCallback);
    imageDataObject.onPixelDataInsertedError(onPixelDataInsertedErrorCallback);
  }

  getDataDetails(study, displaySet) {
    const groupDetailsInField = (field, extraFields = {}) => {
      const fieldValue = field || '';
      const { studyDescription, seriesNumber, seriesDescription } = extraFields;
      return (
        <>
          {fieldValue}
          <div>{studyDescription}</div>
          <div>{seriesNumber >= 0 ? `Ser: ${seriesNumber}` : ''}</div>
          <div>{seriesDescription}</div>
        </>
      );
    };

    const dataDetails = {
      studyDate: undefined, //study.studyDate,
      studyTime: undefined, //study.studyTime,
      studyDescription: undefined, //study.StudyDescription,
      patientName: study.PatientName,
      // patientId: study.PatientID,
      patientId: groupDetailsInField('', {
        studyDescription: study.StudyDescription,
        seriesNumber: String(displaySet.SeriesNumber),
        seriesDescription: displaySet.SeriesDescription,
      }),
      seriesNumber: undefined, //String(displaySet.SeriesNumber),
      seriesDescription: undefined, //displaySet.SeriesDescription,
    };

    return dataDetails;
  }

  render() {
    let childrenWithProps = null;
    const { configuration } = segmentationModule;

    // TODO: Does it make more sense to use Context?
    if (this.props.children && this.props.children.length) {
      childrenWithProps = this.props.children.map((child, index) => {
        return (
          child &&
          React.cloneElement(child, {
            viewportIndex: this.props.viewportIndex,
            key: index,
          })
        );
      });
    }

    const style = { width: '100%', height: '100%', position: 'relative' };

    return (
      <>
        <div style={style}>
          {!this.state.isLoaded && (
            <LoadingIndicator percentComplete={this.state.percentComplete} />
          )}
          {!this.state.fusionIsLoaded && (
            <LoadingIndicator
              percentComplete={this.state.fusionPercentComplete}
            />
          )}
          {this.state.volumes && (
            <ConnectedVTKViewport
              volumes={this.state.volumes}
              paintFilterLabelMapImageData={
                this.state.paintFilterLabelMapImageData
              }
              paintFilterBackgroundImageData={
                this.state.paintFilterBackgroundImageData
              }
              viewportIndex={this.props.viewportIndex}
              dataDetails={this.state.dataDetails}
              labelmapRenderingOptions={{
                colorLUT: this.state.labelmapColorLUT,
                globalOpacity: configuration.fillAlpha,
                visible: configuration.renderFill,
                outlineThickness: configuration.outlineWidth,
                renderOutline: configuration.renderOutline,
                segmentsDefaultProperties: this.segmentsDefaultProperties,
                onNewSegmentationRequested: () => {
                  this.setStateFromProps();
                },
              }}
              onScroll={this.props.onScroll}
            />
          )}
        </div>
        {childrenWithProps}
      </>
    );
  }
}

/**
 * Takes window levels and converts them to a range (lower/upper)
 * for use with VTK RGBTransferFunction
 *
 * @private
 * @param {number} [width] - the width of our window
 * @param {number} [center] - the center of our window
 * @param {string} [Modality] - 'PT', 'CT', etc.
 * @returns { lower, upper } - range
 */
function _getRangeFromWindowLevels(width, center, Modality = undefined) {
  // For PET just set the range to 0-5 SUV
  if (Modality === 'PT') {
    const pt = DEFAULT_MODALITY_RANGE.PT;
    return { lower: pt[0], upper: pt[1] };
  }

  const levelsAreNotNumbers = isNaN(center) || isNaN(width);

  if (levelsAreNotNumbers) {
    return { lower: 0, upper: 512 };
  }

  return {
    lower: center - width / 2.0,
    upper: center + width / 2.0,
  };
}

export default OHIFVTKViewport;
