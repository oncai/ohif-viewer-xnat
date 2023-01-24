import { DATA_IMPORT_STATUS } from '@xnat-ohif/extension-xnat';
import getCSRoiCollectionList from './getCSRoiCollectionList';
import getRoiDataArray from './getRoiDataArray';
import meshBuilderWorkerPool from './workers/MeshBuilderWorkerPool';

import OHIF from '@ohif/core';
const { setViewportSpecificData } = OHIF.redux.actions;

const displaysetRoiCollectionsMap = new Map();

class ContourRenderingApi {
  updateCollections(displaySetInstanceUID, SeriesInstanceUID) {
    const newCollections = getCSRoiCollectionList(
      displaySetInstanceUID,
      SeriesInstanceUID
    );

    if (!displaysetRoiCollectionsMap.has(displaySetInstanceUID)) {
      displaysetRoiCollectionsMap.set(displaySetInstanceUID, {});
    }
    const collections = displaysetRoiCollectionsMap.get(displaySetInstanceUID);

    const newCollectionUids = Object.keys(newCollections);
    const collectionUids = Object.keys(collections);
    const sharedCollectionUids = newCollectionUids.filter(uid =>
      collectionUids.includes(uid)
    );

    // Remove previous collections which are not current
    collectionUids.forEach(
      uid => !sharedCollectionUids.includes(uid) && delete collections[uid]
    );

    newCollectionUids.forEach(collectionUid => {
      const newRoiCollection = newCollections[collectionUid];
      const newRois = newRoiCollection.rois;

      if (!collectionUids.includes(collectionUid)) {
        // Add new collection
        Object.keys(newRois).forEach(roiUid => {
          this._assignRoiParameters(newRois[roiUid]);
        });
        collections[collectionUid] = newRoiCollection;
        // collections[collectionUid] = {
        //   ...newRoiCollection,
        // };
      } else {
        const rois = collections[collectionUid].rois;
        this._updateRois(rois, newRois);
      }
    });
  }

  reconstructRois(displaySetInstanceUID) {
    const collections = this.getCollectionList(displaySetInstanceUID);
    if (!collections) {
      return;
    }

    const { roisToReconstruct, roisReconstructed } = this._getRoisToReconstruct(
      collections
    );

    if (roisReconstructed.length > 0) {
      onRenderPreviousRois(roisReconstructed);
    }

    if (roisToReconstruct.length > 0) {
      roisToReconstruct.forEach(roi => {
        const pointData = getRoiDataArray(roi);
        if (pointData) {
          meshBuilderWorkerPool.queueJob({
            params: { uid: roi.uid, pointData },
          });
        }
      });
    }
  }

  updateAndReconstruct(displaySetInstanceUID, SeriesInstanceUID) {
    this.updateCollections(displaySetInstanceUID, SeriesInstanceUID);
    this.reconstructRois(displaySetInstanceUID);
  }

  getCollectionList(displaySetInstanceUID) {
    return displaysetRoiCollectionsMap.get(displaySetInstanceUID);
  }

  getCollection(displaySetInstanceUID, collectionUid) {
    const collectionList = this.getCollectionList(displaySetInstanceUID);
    if (collectionList && collectionList[collectionUid]) {
      return collectionList[collectionUid];
    }
  }

  getRoi(displaySetInstanceUID, collectionUid, roiUid) {
    const collection = this.getCollection(displaySetInstanceUID, collectionUid);
    if (collection && collection.rois && collection.rois[roiUid]) {
      return collection.rois[roiUid];
    }
  }

  getRoiByUid(roiUid) {
    for (const collectionList of displaysetRoiCollectionsMap.values()) {
      for (const collection of Object.values(collectionList)) {
        if (collection.rois) {
          for (const roi of Object.values(collection.rois)) {
            if (roiUid === roi.uid) {
              return roi;
            }
          }
        }
      }
    }

    return undefined;
  }

  _assignRoiParameters(roi) {
    roi.isReconstructed = DATA_IMPORT_STATUS.NOT_IMPORTED;
    roi.meshVisible = true;
    roi.reconstruct = true;
    return roi;
  }

  _updateRois(rois, newRois) {
    // Update collection ROIs
    const newRoiUids = Object.keys(newRois);
    const roiUids = Object.keys(rois);

    const sharedRoiUids = newRoiUids.filter(uid => roiUids.includes(uid));

    // Remove previous ROIs which are not current
    roiUids.forEach(uid => !sharedRoiUids.includes(uid) && delete rois[uid]);

    newRoiUids.forEach(roiUid => {
      if (!roiUids.includes(roiUid)) {
        // Add a new ROI
        rois[roiUid] = this._assignRoiParameters(newRois[roiUid]);
      } else {
        // Check and invalidate ROIs with modified contour data
        const newRoi = newRois[roiUid];
        const roi = rois[roiUid];

        roi.name = newRoi.name;
        roi.color = newRoi.color;

        const newContours = newRois[roiUid].contours;
        const contours = rois[roiUid].contours;

        const newContourUids = Object.keys(newContours);
        const contourUids = Object.keys(contours);

        const sharedContourUids = newContourUids.filter(uid =>
          contourUids.includes(uid)
        );

        let requiresUpdate = false;
        if (contourUids.length !== sharedContourUids.length) {
          requiresUpdate = true;
        } else {
          requiresUpdate = contourUids.some(
            uid => contours[uid].timestamp !== newContours[uid].timestamp
          );
        }

        if (requiresUpdate) {
          roi.reconstruct = true;
          roi.isReconstructed = DATA_IMPORT_STATUS.NOT_IMPORTED;
          if (roi.polyData) {
            delete roi.polyData;
          }
        }
      }
    });
  }

  _getRoisToReconstruct(collections) {
    const roisToReconstruct = [];
    const roisReconstructed = [];
    Object.keys(collections).forEach(collectionUid => {
      const collection = collections[collectionUid];
      if (collection && collection.rois) {
        const rois = collection.rois;
        Object.keys(rois).forEach(roiUid => {
          const roi = rois[roiUid];
          if (roi.reconstruct) {
            roisToReconstruct.push(roi);
          } else if (roi.isReconstructed && roi.polyData) {
            roisReconstructed.push(roi);
          }
        });
      }
    });

    return { roisToReconstruct, roisReconstructed };
  }
}

const onRenderPreviousRois = rois => {
  setTimeout(() => {
    const viewports = window.store.getState().viewports;
    const viewportSpecificData = viewports.viewportSpecificData[0];
    let vtkContourRoisData = viewportSpecificData.vtkContourRoisData || {};

    const roiData = {};
    rois.forEach(roi => {
      roiData[roi.uid] = {
        polyData: roi.polyData,
        color: roi.color,
      };
    });

    vtkContourRoisData = {
      ...vtkContourRoisData,
      ...roiData,
    };

    for (let i = 0; i < 3; i++) {
      window.store.dispatch(
        setViewportSpecificData(i, {
          vtkContourRoisData,
        })
      );
    }
  }, 1000);
};

const contourRenderingApi = new ContourRenderingApi();

export default contourRenderingApi;
