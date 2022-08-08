import { xnatMeasurementApi } from '../api';
import refreshViewports from '../../utils/refreshViewports';

const toggleItemVisibility = (
  uuid,
  displaySetInstanceUID,
  lockedMeasurement = false
) => {
  const collections = xnatMeasurementApi.getMeasurementCollections({
    displaySetInstanceUID,
  });

  let collection;
  if (lockedMeasurement) {
    collection = undefined;
  } else {
    collection = collections.workingCollection;
  }

  const collectionVisible = collection.internal.visible;
  const measurement = collection.getMeasurement(uuid);
  measurement.metadata.visible = !measurement.metadata.visible;

  measurement.csData.visible =
    collectionVisible && measurement.metadata.visible;

  refreshViewports();
};

const toggleCollectionVisibility = (
  uuid,
  displaySetInstanceUID,
  lockedCollection = false
) => {
  const collections = xnatMeasurementApi.getMeasurementCollections({
    displaySetInstanceUID,
  });

  let collection;
  if (lockedCollection) {
    collection = undefined;
  } else {
    collection = collections.workingCollection;
  }

  collection.internal.visible = !collection.internal.visible;
  collection.measurements.forEach(measurement => {
    measurement.csData.visible =
      collection.internal.visible && measurement.metadata.visible;
  });

  refreshViewports();
};

const toggleVisibility = {
  item: toggleItemVisibility,
  collection: toggleCollectionVisibility,
};

export default toggleVisibility;
