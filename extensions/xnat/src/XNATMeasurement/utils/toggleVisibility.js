import { xnatMeasurementApi } from '../api';
import refreshViewports from '../../utils/refreshViewports';

const toggleItemVisibility = (
  uuid,
  displaySetInstanceUID,
  importedCollectionUuid = undefined
) => {
  const collections = xnatMeasurementApi.getMeasurementCollections(
    displaySetInstanceUID
  );

  let collection;
  if (importedCollectionUuid) {
    collection = collections.importedCollections.find(
      collectionI => collectionI.metadata.uuid === importedCollectionUuid
    );
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
  displaySetInstanceUID,
  importedCollectionUuid = undefined
) => {
  const collections = xnatMeasurementApi.getMeasurementCollections(
    displaySetInstanceUID
  );

  let collection;
  if (importedCollectionUuid) {
    collection = collections.importedCollections.find(
      collectionI => collectionI.metadata.uuid === importedCollectionUuid
    );
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
