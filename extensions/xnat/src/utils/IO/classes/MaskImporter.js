import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import * as dcmjs from 'dcmjs';
import { utils } from '@ohif/core';

const { studyMetadataManager } = utils;
const segmentationModule = cornerstoneTools.getModule('segmentation');

export default class MaskImporter {
  constructor(seriesInstanceUid) {
    const imageIds = this._getImageIds(seriesInstanceUid);

    const { rows, columns } = cornerstone.metaData.get(
      'imagePlaneModule',
      imageIds[0]
    );

    const dimensions = {
      rows,
      columns,
      slices: imageIds.length,
    };

    dimensions.sliceLength = dimensions.rows * dimensions.columns;
    dimensions.cube = dimensions.sliceLength * dimensions.slices;

    this._seriesInstanceUid = seriesInstanceUid;
    this._imageIds = imageIds;
    this._dimensions = dimensions;
  }

  /**
   * _getImageIds - Returns the imageIds for the stack.
   *
   * @param  {type} seriesInstanceUid description
   * @returns {type}                   description
   */
  _getImageIds(seriesInstanceUid) {
    // Get the imageId of each sopInstance in the series
    const imageIds = [];

    const studies = studyMetadataManager.all();
    for (let i = 0; i < studies.length; i++) {
      const study = studies[i];
      const displaySets = study.getDisplaySets();

      for (let j = 0; j < displaySets.length; j++) {
        const displaySet = displaySets[j];

        debugger;

        if (displaySet.seriesInstanceUid === seriesInstanceUid) {
          const images = displaySet.images;

          for (let k = 0; k < images.length; k++) {
            imageIds.push(images[k].getImageId());
          }
        }
      }
    }

    return imageIds;
  }

  /**
   * importDICOMSEG - Imports a DICOM SEG file to CornerstoneTools.
   *
   * @param  {ArrayBuffer} dicomSegArrayBuffer An arraybuffer of the DICOM SEG object.
   * @returns {null}                     description
   */
  importDICOMSEG(dicomSegArrayBuffer) {
    return new Promise(resolve => {
      const imageIds = this._imageIds;
      const imagePromises = [];

      for (let i = 0; i < imageIds.length; i++) {
        imagePromises.push(cornerstone.loadAndCacheImage(imageIds[i]));
      }

      Promise.all(imagePromises).then(() => {
        const {
          labelmapBuffer,
          segMetadata,
          segmentsOnFrame,
        } = dcmjs.adapters.Cornerstone.Segmentation.generateToolState(
          imageIds,
          dicomSegArrayBuffer,
          cornerstone.metaData
        );

        const firstImageId = imageIds[0];

        // Delete old labelmap
        if (segmentationModule.state.series[firstImageId]) {
          delete segmentationModule.state.series[firstImageId];
        }

        console.log(segMetadata);

        const metadata = segMetadata.data;

        debugger;

        segmentationModule.setters.labelmap3DByFirstImageId(
          firstImageId,
          labelmapBuffer,
          0, // TODO -> Can define a color LUT based on colors in the SEG later.
          metadata,
          imageIds.length,
          segmentsOnFrame
        );

        resolve();
      });
    });
  }
}
