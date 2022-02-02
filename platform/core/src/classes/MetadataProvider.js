import dcmjs from 'dcmjs';
import queryString from 'query-string';
import dicomParser from 'dicom-parser';
import cornerstone from 'cornerstone-core';
import getPixelSpacingInformation from '../utils/metadataProvider/getPixelSpacingInformation';
import fetchPaletteColorLookupTableData from '../utils/metadataProvider/fetchPaletteColorLookupTableData';
import fetchOverlayData from '../utils/metadataProvider/fetchOverlayData';
import validNumber from '../utils/metadataProvider/validNumber';
import unpackOverlay from '../utils/metadataProvider/unpackOverlay';
import getImagePlaneInformation from '../utils/metadataProvider/getImagePlaneInformation';

const { DicomMessage, DicomMetaDictionary } = dcmjs.data;

const isXnatConfig =
  process.env.NODE_ENV === 'production' ||
  process.env.APP_CONFIG === 'config/xnat-dev.js';

class MetadataProvider {
  constructor() {
    // Define the main "metadataLookup" private property as an immutable property.
    Object.defineProperty(this, 'studies', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: new Map(),
    });
    Object.defineProperty(this, 'imageIdToUIDs', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: new Map(),
    });
    this.datasets = {};
    this.isMetadataLoadedFromImage = [];
  }

  readDataset(arrayBuffer, imageId) {
    let dataset;
    if (arrayBuffer) {
      const dicomData = DicomMessage.readFile(arrayBuffer, {
        untilTag: '7FE00010',
        includeUntilTagValue: false,
      });
      dataset = DicomMetaDictionary.naturalizeDataset(dicomData.dict);
      dataset._meta = DicomMetaDictionary.naturalizeDataset(dicomData.meta);
      this.isMetadataLoadedFromImage.push(imageId);
    }
    return dataset;
  }

  shouldFetchDataset(dicomJSONDataset) {
    const hasPaletteColor =
      dicomJSONDataset.PhotometricInterpretation === 'PALETTE COLOR';
    // const isMultiFrame = dicomJSONDataset.NumberOfFrames > 1;
    // const isModalityNM = dicomJSONDataset.Modality === 'NM';
    return hasPaletteColor;
  }

  loadMetadataFromImage(imageId) {
    if (this.isMetadataLoadedFromImage.includes(imageId)) {
      return true;
    }

    let metaLoadedFromImage = false;

    const imageId0 = `${imageId}?frame=0`;
    const imageIdInCache =
      imageId in cornerstone.imageCache.imageCache ||
      imageId0 in cornerstone.imageCache.imageCache;

    if (imageIdInCache) {
      const imageCache = cornerstone.imageCache.imageCache[imageId] ||
        cornerstone.imageCache.imageCache[imageId0];

      if (imageCache.loaded) {
        const arrayBuffer = imageCache.image.data.byteArray.buffer;
        let dataset;
        if (arrayBuffer) {
          dataset = this.readDataset(arrayBuffer, imageId);
        }
        if (dataset) {
          // Update instance data
          const uids = this._getUIDsFromImageID(imageId);
          if (!uids) {
            return;
          }
          const { StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID } = uids;

          const study = this.studies.get(StudyInstanceUID);
          if (!study) {
            return;
          }

          const series = study.series.get(SeriesInstanceUID);
          if (!series) {
            return;
          }

          let instance = series.instances.get(SOPInstanceUID);
          if (!instance) {
            instance = {};
          }
          // instance = { ...instance, ...dataset };
          series.instances.set(SOPInstanceUID, dataset);

          metaLoadedFromImage = true;
        }
      }
    }

    return metaLoadedFromImage;
  }

  async addInstance(_dicomJSONDatasetOrP10ArrayBuffer, options = {}) {
    let dicomJSONDataset;

    let dicomJSONDatasetOrP10ArrayBuffer;
    if (isXnatConfig) {
      if (this.shouldFetchDataset(_dicomJSONDatasetOrP10ArrayBuffer)) {
        const image = await cornerstone.loadAndCacheImage(options.imageId);
        const arrayBuffer = image.data.byteArray.buffer;
        dicomJSONDatasetOrP10ArrayBuffer = this.readDataset(
          arrayBuffer,
          options.imageId
        );
      } else {
        dicomJSONDatasetOrP10ArrayBuffer = _dicomJSONDatasetOrP10ArrayBuffer;
      }
    } else {
      dicomJSONDatasetOrP10ArrayBuffer = _dicomJSONDatasetOrP10ArrayBuffer;
    }

    // If Arraybuffer, parse to DICOMJSON before naturalizing.
    if (dicomJSONDatasetOrP10ArrayBuffer instanceof ArrayBuffer) {
      const dicomData = DicomMessage.readFile(dicomJSONDatasetOrP10ArrayBuffer);

      dicomJSONDataset = dicomData.dict;
    } else {
      dicomJSONDataset = dicomJSONDatasetOrP10ArrayBuffer;
    }

    // Check if dataset is already naturalized.

    let naturalizedDataset;

    if (dicomJSONDataset['SeriesInstanceUID'] === undefined) {
      naturalizedDataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(
        dicomJSONDataset
      );
    } else {
      naturalizedDataset = dicomJSONDataset;
    }

    const {
      StudyInstanceUID,
      SeriesInstanceUID,
      SOPInstanceUID,
    } = naturalizedDataset;

    this._getAndCacheStudyDataset(StudyInstanceUID, dicomJSONDataset);
    const study = this._getAndCacheStudy(StudyInstanceUID);
    const series = this._getAndCacheSeriesFromStudy(study, SeriesInstanceUID);
    const instance = this._getAndCacheInstanceFromStudy(series, SOPInstanceUID);

    Object.assign(instance, naturalizedDataset);

    await this._checkBulkDataAndInlineBinaries(instance, options.server);

    return instance;
  }

  addImageIdToUIDs(imageId, uids) {
    // This method is a fallback for when you don't have WADO-URI or WADO-RS.
    // You can add instances fetched by any method by calling addInstance, and hook an imageId to point at it here.
    // An example would be dicom hosted at some random site.

    this.imageIdToUIDs.set(imageId, uids);
  }

  _getAndCacheStudyDataset(StudyInstanceUID, dataset) {
    if (!this.datasets[StudyInstanceUID]) {
      this.datasets[StudyInstanceUID] = dataset;
    }
  }

  getStudyDataset(StudyInstanceUID) {
    return this.datasets[StudyInstanceUID];
  }

  _getAndCacheStudy(StudyInstanceUID) {
    const studies = this.studies;

    let study = studies.get(StudyInstanceUID);

    if (!study) {
      study = { series: new Map() };
      studies.set(StudyInstanceUID, study);
    }

    return study;
  }

  _getAndCacheSeriesFromStudy(study, SeriesInstanceUID) {
    let series = study.series.get(SeriesInstanceUID);

    if (!series) {
      series = { instances: new Map() };
      study.series.set(SeriesInstanceUID, series);
    }

    return series;
  }

  _getAndCacheInstanceFromStudy(series, SOPInstanceUID) {
    let instance = series.instances.get(SOPInstanceUID);

    if (!instance) {
      instance = {};
      series.instances.set(SOPInstanceUID, instance);
    }

    return instance;
  }

  async _checkBulkDataAndInlineBinaries(instance, server) {
    await fetchOverlayData(instance, server);

    if (instance.PhotometricInterpretation === 'PALETTE COLOR') {
      await fetchPaletteColorLookupTableData(instance, server);
    }
  }

  _getInstance(imageId) {
    const uids = this._getUIDsFromImageID(imageId);

    if (!uids) {
      return;
    }

    const { StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID } = uids;

    return this._getInstanceData(
      StudyInstanceUID,
      SeriesInstanceUID,
      SOPInstanceUID
    );
  }

  get(query, imageId, options = { fallback: false }) {
    let instance;

    let frameIndex;
    if (isXnatConfig) {
      if (query === WADO_IMAGE_LOADER_TAGS.VOI_LUT_MODULE) {
        // The XNAT Viewer plugin sets WL/WW to [80, 400] for missing values
        return;
      }

      let enableMetaPrefetch = true;
      if (enableMetaPrefetch) {
        // Attempt to load metadata from instance
        let imageIdToUse = imageId;
        const qIndex = imageId.indexOf('?frame=');
        if (qIndex > 0) {
          imageIdToUse = imageId.substr(0, qIndex);
          frameIndex = imageId.substr(qIndex + 7); //'?frame='.length;
        }
        this.loadMetadataFromImage(imageIdToUse);
      }
    }

    instance = this._getInstance(imageId);

    if (query === INSTANCE) {
      return instance;
    }

    const meta = this.getTagFromInstance(query, instance, {
      ...options,
      frameIndex,
    });

    return meta;

    // return this.getTagFromInstance(query, instance, options);
  }

  getTag(query, imageId, options) {
    return this.get(query, imageId, options);
  }

  getInstance(imageId) {
    return this.get(INSTANCE, imageId);
  }

  getTagFromInstance(
    naturalizedTagOrWADOImageLoaderTag,
    instance,
    options = { fallback: false }
  ) {
    if (!instance) {
      return;
    }

    // If its a naturalized dcmjs tag present on the instance, return.
    if (instance[naturalizedTagOrWADOImageLoaderTag]) {
      return instance[naturalizedTagOrWADOImageLoaderTag];
    }

    // Maybe its a legacy CornerstoneWADOImageLoader tag then:
    return this._getCornerstoneWADOImageLoaderTag(
      naturalizedTagOrWADOImageLoaderTag,
      instance,
      options
    );
  }

  _getCornerstoneWADOImageLoaderTag(wadoImageLoaderTag, instance, options) {
    let metadata;
    const { frameIndex } = options;

    switch (wadoImageLoaderTag) {
      case WADO_IMAGE_LOADER_TAGS.GENERAL_SERIES_MODULE:
        const { SeriesDate, SeriesTime } = instance;

        let seriesDate;
        let seriesTime;

        if (SeriesDate) {
          seriesDate = dicomParser.parseDA(SeriesDate);
        }

        if (SeriesTime) {
          seriesTime = dicomParser.parseTM(SeriesTime);
        }

        metadata = {
          modality: instance.Modality,
          seriesInstanceUID: instance.SeriesInstanceUID,
          seriesNumber: instance.SeriesNumber,
          studyInstanceUID: instance.StudyInstanceUID,
          seriesDate,
          seriesTime,
          seriesDescription: instance.SeriesDescription,
        };
        break;
      case WADO_IMAGE_LOADER_TAGS.PATIENT_STUDY_MODULE:
        metadata = {
          patientAge: instance.PatientAge,
          patientSize: instance.PatientSize,
          patientWeight: instance.PatientWeight,
        };
        break;
      case WADO_IMAGE_LOADER_TAGS.IMAGE_PLANE_MODULE:
        let ImageOrientationPatient;
        let ImagePositionPatient;

        if (instance.Modality === 'NM') {
          const planeinfo = getImagePlaneInformation(instance, frameIndex);
          ImageOrientationPatient = planeinfo.ImageOrientationPatient;
          ImagePositionPatient = planeinfo.ImagePositionPatient;
        } else {
          ImageOrientationPatient = instance.ImageOrientationPatient;
          ImagePositionPatient = instance.ImagePositionPatient;
        }

        // Fallback for DX images.
        // TODO: We should use the rest of the results of this function
        // to update the UI somehow
        let { PixelSpacing } = getPixelSpacingInformation(instance);

        // Fallback for Secondary Capture Image IOD
        if (instance.SOPClassUID === '1.2.840.10008.5.1.4.1.1.7') {
          /*
          if (!ImageOrientationPatient) {
            ImageOrientationPatient = [0, 0, 0, 0, 0, 0];
          }
          if (!ImagePositionPatient) {
            ImagePositionPatient = [0, 0, 0];
          }
          */
          if (!PixelSpacing) {
            PixelSpacing = instance.NominalScannedPixelSpacing || [1.0, 1.0];
          }
        }

        let rowPixelSpacing;
        let columnPixelSpacing;

        let rowCosines;
        let columnCosines;

        if (PixelSpacing) {
          rowPixelSpacing = PixelSpacing[0];
          columnPixelSpacing = PixelSpacing[1];
        }

        if (ImageOrientationPatient) {
          rowCosines = ImageOrientationPatient.slice(0, 3);
          columnCosines = ImageOrientationPatient.slice(3, 6);
        }

        metadata = {
          frameOfReferenceUID: instance.FrameOfReferenceUID,
          rows: instance.Rows,
          columns: instance.Columns,
          imageOrientationPatient: ImageOrientationPatient,
          rowCosines,
          columnCosines,
          imagePositionPatient: ImagePositionPatient,
          sliceThickness: instance.SliceThickness,
          sliceLocation: instance.SliceLocation,
          pixelSpacing: PixelSpacing,
          rowPixelSpacing,
          columnPixelSpacing,
        };
        break;
      case WADO_IMAGE_LOADER_TAGS.IMAGE_PIXEL_MODULE:
        metadata = {
          samplesPerPixel: instance.SamplesPerPixel,
          photometricInterpretation: instance.PhotometricInterpretation,
          rows: instance.Rows,
          columns: instance.Columns,
          bitsAllocated: instance.BitsAllocated,
          bitsStored: instance.BitsStored,
          highBit: instance.HighBit,
          pixelRepresentation: instance.PixelRepresentation,
          planarConfiguration: instance.PlanarConfiguration,
          pixelAspectRatio: instance.PixelAspectRatio,
          smallestPixelValue: instance.SmallestPixelValue,
          largestPixelValue: instance.LargestPixelValue,
          redPaletteColorLookupTableDescriptor:
            instance.RedPaletteColorLookupTableDescriptor,
          greenPaletteColorLookupTableDescriptor:
            instance.GreenPaletteColorLookupTableDescriptor,
          bluePaletteColorLookupTableDescriptor:
            instance.BluePaletteColorLookupTableDescriptor,
          redPaletteColorLookupTableData:
            instance.RedPaletteColorLookupTableData,
          greenPaletteColorLookupTableData:
            instance.GreenPaletteColorLookupTableData,
          bluePaletteColorLookupTableData:
            instance.BluePaletteColorLookupTableData,
        };

        break;
      case WADO_IMAGE_LOADER_TAGS.VOI_LUT_MODULE:
        let { WindowCenter, WindowWidth } = instance;

        const windowCenter = Array.isArray(WindowCenter)
          ? WindowCenter
          : [WindowCenter];
        const windowWidth = Array.isArray(WindowWidth)
          ? WindowWidth
          : [WindowWidth];

        metadata = {
          windowCenter: validNumber(windowCenter),
          windowWidth: validNumber(windowWidth),
        };

        break;
      case WADO_IMAGE_LOADER_TAGS.MODALITY_LUT_MODULE:
        const rescaleSlope = validNumber(instance.RescaleSlope);
        const rescaleIntercept = validNumber(instance.RescaleIntercept);
        metadata = {
          rescaleIntercept,
          rescaleSlope,
          rescaleType: instance.RescaleType,
        };
        break;
      case WADO_IMAGE_LOADER_TAGS.SOP_COMMON_MODULE:
        metadata = {
          sopClassUID: instance.SOPClassUID,
          sopInstanceUID: instance.SOPInstanceUID,
        };
        break;
      case WADO_IMAGE_LOADER_TAGS.PET_ISOTOPE_MODULE:
        const { RadiopharmaceuticalInformationSequence } = instance;

        if (RadiopharmaceuticalInformationSequence) {
          const RadiopharmaceuticalInformation = Array.isArray(
            RadiopharmaceuticalInformationSequence
          )
            ? RadiopharmaceuticalInformationSequence[0]
            : RadiopharmaceuticalInformationSequence;

          const {
            RadiopharmaceuticalStartTime,
            RadionuclideTotalDose,
            RadionuclideHalfLife,
          } = RadiopharmaceuticalInformation;

          const radiopharmaceuticalInfo = {
            radiopharmaceuticalStartTime: dicomParser.parseTM(
              RadiopharmaceuticalStartTime
            ),
            radionuclideTotalDose: RadionuclideTotalDose,
            radionuclideHalfLife: RadionuclideHalfLife,
          };
          metadata = {
            radiopharmaceuticalInfo,
          };
        }

        break;
      case WADO_IMAGE_LOADER_TAGS.OVERLAY_PLANE_MODULE:
        const overlays = [];

        for (
          let overlayGroup = 0x00;
          overlayGroup <= 0x1e;
          overlayGroup += 0x02
        ) {
          let groupStr = `60${overlayGroup.toString(16)}`;

          if (groupStr.length === 3) {
            groupStr = `600${overlayGroup.toString(16)}`;
          }

          const OverlayDataTag = `${groupStr}3000`;
          let OverlayData = instance[OverlayDataTag];

          if (!OverlayData) {
            continue;
          }

          if (Array.isArray(OverlayData)) OverlayData = OverlayData[0];

          if (OverlayData instanceof ArrayBuffer) {
            OverlayData = instance[OverlayDataTag] = unpackOverlay(OverlayData);
          }

          const OverlayRowsTag = `${groupStr}0010`;
          const OverlayColumnsTag = `${groupStr}0011`;
          const OverlayType = `${groupStr}0040`;
          const OverlayOriginTag = `${groupStr}0050`;
          const OverlayDescriptionTag = `${groupStr}0022`;
          const OverlayLabelTag = `${groupStr}1500`;
          const ROIAreaTag = `${groupStr}1301`;
          const ROIMeanTag = `${groupStr}1302`;
          const ROIStandardDeviationTag = `${groupStr}1303`;
          const OverlayOrigin = instance[OverlayOriginTag];

          const overlay = {
            rows: instance[OverlayRowsTag],
            columns: instance[OverlayColumnsTag],
            type: instance[OverlayType],
            x: OverlayOrigin[0],
            y: OverlayOrigin[1],
            pixelData: OverlayData,
            description: instance[OverlayDescriptionTag],
            label: instance[OverlayLabelTag],
            roiArea: instance[ROIAreaTag],
            roiMean: instance[ROIMeanTag],
            roiStandardDeviation: instance[ROIStandardDeviationTag],
          };

          overlays.push(overlay);
        }

        metadata = {
          overlays,
        };

        break;

      case WADO_IMAGE_LOADER_TAGS.PATIENT_MODULE:
        const { PatientName } = instance;

        let patientName;
        if (PatientName) {
          if (PatientName.hasOwnProperty('Alphabetic')) {
            patientName = PatientName.Alphabetic;
          } else {
            patientName = PatientName;
          }
        }

        metadata = {
          patientName,
          patientId: instance.PatientID,
        };

        break;

      case WADO_IMAGE_LOADER_TAGS.GENERAL_IMAGE_MODULE:
        metadata = {
          sopInstanceUid: instance.SOPInstanceUID,
          instanceNumber: instance.InstanceNumber,
          lossyImageCompression: instance.LossyImageCompression,
          lossyImageCompressionRatio: instance.LossyImageCompressionRatio,
          lossyImageCompressionMethod: instance.LossyImageCompressionMethod,
        };

        break;
      case WADO_IMAGE_LOADER_TAGS.GENERAL_STUDY_MODULE:
        metadata = {
          studyDescription: instance.StudyDescription,
          studyDate: instance.StudyDate,
          studyTime: instance.StudyTime,
          accessionNumber: instance.AccessionNumber,
        };

        break;
      case WADO_IMAGE_LOADER_TAGS.CINE_MODULE:
        metadata = {
          frameTime: instance.FrameTime,
        };

        break;
    }

    return metadata;
  }

  _getInstanceData(StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID) {
    const study = this.studies.get(StudyInstanceUID);

    if (!study) {
      return;
    }

    const series = study.series.get(SeriesInstanceUID);

    if (!series) {
      return;
    }

    const instance = series.instances.get(SOPInstanceUID);

    return instance;
  }

  _getUIDsFromImageID(imageId) {
    if (imageId.includes('wadors:')) {
      const strippedImageId = imageId.split('studies/')[1];
      const splitImageId = strippedImageId.split('/');

      return {
        StudyInstanceUID: splitImageId[0], // Note: splitImageId[1] === 'series'
        SeriesInstanceUID: splitImageId[2], // Note: splitImageId[3] === 'instances'
        SOPInstanceUID: splitImageId[4],
      };
    }
    if (imageId.includes('wado?requestType=WADO')) {
      const qs = queryString.parse(imageId);

      return {
        StudyInstanceUID: qs.studyUID,
        SeriesInstanceUID: qs.seriesUID,
        SOPInstanceUID: qs.objectUID,
      };
    } else {
      // Maybe its a non-standard imageId
      return this.imageIdToUIDs.get(imageId);
    }
  }
}

const metadataProvider = new MetadataProvider();

export default metadataProvider;

const WADO_IMAGE_LOADER_TAGS = {
  // CornerstoneWADOImageLoader specific
  GENERAL_SERIES_MODULE: 'generalSeriesModule',
  PATIENT_STUDY_MODULE: 'patientStudyModule',
  IMAGE_PLANE_MODULE: 'imagePlaneModule',
  IMAGE_PIXEL_MODULE: 'imagePixelModule',
  VOI_LUT_MODULE: 'voiLutModule',
  MODALITY_LUT_MODULE: 'modalityLutModule',
  SOP_COMMON_MODULE: 'sopCommonModule',
  PET_ISOTOPE_MODULE: 'petIsotopeModule',
  OVERLAY_PLANE_MODULE: 'overlayPlaneModule',

  // react-cornerstone-viewport specifc
  PATIENT_MODULE: 'patientModule',
  GENERAL_IMAGE_MODULE: 'generalImageModule',
  GENERAL_STUDY_MODULE: 'generalStudyModule',
  CINE_MODULE: 'cineModule',
};

const INSTANCE = 'instance';
