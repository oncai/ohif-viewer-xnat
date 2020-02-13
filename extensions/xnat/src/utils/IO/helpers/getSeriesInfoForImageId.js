import cornerstone from 'cornerstone-core';
import { utils } from '@ohif/core';

const { studyMetadataManager } = utils;

const _getDisplaySet = ({ studyInstanceUid, displaySetInstanceUid }) => {
  const studyMetadata = studyMetadataManager.get(studyInstanceUid);
  const displaySet = studyMetadata.findDisplaySet(
    displaySet => displaySet.displaySetInstanceUid === displaySetInstanceUid
  );
  return displaySet;
};

export default function getSeriesInfoForImageId(viewportData) {
  const displaySet = _getDisplaySet(viewportData);

  const {
    studyInstanceUid,
    seriesInstanceUid,
    modality,
    seriesDate,
    seriesTime,
    images,
  } = displaySet;

  const firstImage = images[0];
  const firstImageData = firstImage.getData();

  debugger;

  const sopClassUid = firstImageData.sopClassUid;

  const seriesInfo = {
    studyInstanceUid,
    seriesInstanceUid,
    modality,
    startDate: seriesDate,
    startTime: seriesTime,
    sopClassUid,
    // TODO: Need to supply this metadata
    person: {
      name: '',
      id: '',
      birthDate: '',
      sex: '',
      ethnicGroup: '',
    },
    equipment: {
      manufacturerName: '',
      manufacturerModelName: '',
      softwareVersion: '',
    },
  };

  let sopInstanceUids = [];

  for (let i = 0; i < images.length; i++) {
    sopInstanceUids.push(images[i].getImageId());
  }

  seriesInfo.sopInstanceUids = sopInstanceUids;

  // seriesInfo = {
  //   studyInstanceUid: metaData.study.studyInstanceUid,
  //   seriesInstanceUid: metaData.series.seriesInstanceUid,
  //   modality:
  //     metaData.series.modality ||
  //     metadataProvider.getFromDataSet(image.data, 'string', 'x00080060'),
  //   startDate:
  //     metaData.series.seriesDate ||
  //     metadataProvider.getFromDataSet(image.data, 'string', 'x00080021'),
  //   startTime:
  //     metaData.series.seriesTime ||
  //     metadataProvider.getFromDataSet(image.data, 'string', 'x00080031'),
  //   sopClassUid: metaData.instance.sopClassUid,
  //   sopInstanceUids: [],
  //   person: {
  //     name: metaData.patient.name,
  //     id:
  //       metaData.patient.id ||
  //       metadataProvider.getFromDataSet(image.data, 'string', 'x00100020'),
  //     birthDate:
  //       metaData.patient.birthDate ||
  //       metadataProvider.getFromDataSet(image.data, 'string', 'x00100030'),
  //     sex:
  //       metaData.patient.sex ||
  //       metadataProvider.getFromDataSet(image.data, 'string', 'x00100040'),
  //     ethnicGroup: metadataProvider.getFromDataSet(
  //       image.data,
  //       'string',
  //       'x00102160'
  //     ),
  //   },
  //   equipment: {
  //     manufacturerName: metadataProvider.getFromDataSet(
  //       image.data,
  //       'string',
  //       'x00080070'
  //     ),
  //     manufacturerModelName: metadataProvider.getFromDataSet(
  //       image.data,
  //       'string',
  //       'x00081090'
  //     ),
  //     softwareVersion: metadataProvider.getFromDataSet(
  //       image.data,
  //       'string',
  //       'x00181020'
  //     ),
  //   },
  // };

  return seriesInfo;
}
