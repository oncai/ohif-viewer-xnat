import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import { xnatMeasurementApi } from '../api';
import refreshViewports from '../../utils/refreshViewports';

const onShowSingleMeasurement = measurementData => {
  measurementData.visible = !measurementData.visible;
  refreshViewports();
};

const onShowAllMeasurements = (measurementData, show) => {};

const onRemoveSingleMeasurement = measurementData => {
  const { toolType, xnatMetadata, uuid } = measurementData;
  const imageId = xnatMetadata.imageId;

  const toolState = csTools.globalImageIdSpecificToolStateManager.saveToolState();
  if (imageId && toolState[imageId]) {
    const toolData = toolState[imageId][toolType];
    const measurementEntries = toolData && toolData.data;
    const measurementEntry = measurementEntries.find(
      item => item.uuid === uuid
    );
    if (measurementEntry) {
      const index = measurementEntries.indexOf(measurementEntry);
      measurementEntries.splice(index, 1);
    }
  }

  xnatMeasurementApi.removeMeasurement({ measurementData, toolType });
  refreshViewports();
};

export {
  onShowSingleMeasurement,
  onShowAllMeasurements,
  onRemoveSingleMeasurement,
};
