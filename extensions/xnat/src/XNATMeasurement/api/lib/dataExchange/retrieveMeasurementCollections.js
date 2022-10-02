import fetchJSON from '../../../../utils/IO/fetchJSON';
import showNotification from '../../../../components/common/showNotification';
import xnatMeasurementApi from '../../XNATMeasurementApi';

const retrieveMeasurementCollection = async (
  collectionInfo,
  callbacks = {}
) => {
  const collectionList = await fetchJSON(collectionInfo.getFilesUri).promise;
  const result = collectionList.ResultSet.Result;

  // No associated file is found (nothing to import, badly deleted roiCollection).
  if (result.length === 0) {
    throw new Error(
      `No associated files were found for collection ${collectionInfo.name}.`
    );
  }

  const collection = result[0];
  const fileType = collection.collection;
  if (fileType === collectionInfo.collectionType) {
    // The URIs fetched have an additional /, so remove it.
    const uri = collection.URI.slice(1);
    const collectionObject = await fetchJSON(uri).promise;
    if (!collectionObject) {
      throw new Error('Error importing the measurement file.');
    }
    xnatMeasurementApi.addImportedCollection(
      collectionInfo.referencedSeriesInstanceUid,
      collectionInfo.label,
      collectionObject
    );
  } else {
    throw new Error(
      `Collection ${collectionInfo.name} has unsupported filetype: ${collectionInfo.collectionType}.`
    );
  }
};

const retrieveMeasurementCollections = async (
  collectionsToParse,
  callbacks = {}
) => {
  let numCollectionsParsed = 0;
  const numCollectionsToParse = collectionsToParse.length;

  for (let i = 0; i < numCollectionsToParse; i++) {
    const collectionInfo = collectionsToParse[i];
    if (callbacks.updateImportingText) {
      const importingText = [
        `Collection: ${numCollectionsParsed + 1}/${numCollectionsToParse}`,
        `${collectionInfo.name}`,
      ];
      callbacks.updateImportingText(importingText);
    }
    if (callbacks.updateProgress) {
      callbacks.updateProgress('');
    }
    try {
      await retrieveMeasurementCollection(collectionInfo, callbacks);
    } catch (e) {
      const errorMessage = e.message || 'Unknown error';
      showNotification(
        errorMessage,
        'error',
        `Importing Collection '${collectionInfo.name}'`
      );
      console.error(
        `Error importing collection '${collectionInfo.name}': ${errorMessage}`
      );
    }
    numCollectionsParsed++;
  }

  if (callbacks.onImportComplete) {
    callbacks.onImportComplete();
  }
};

export default retrieveMeasurementCollections;
