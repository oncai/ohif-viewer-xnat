import { MONAI_MODEL_TYPES, MONAIClient } from '../../api';
import csTools from 'cornerstone-tools';

const globalToolStateManager =
  csTools.globalImageIdSpecificToolStateManager;

const state = {
  points: new Map(),
  menuIsOpen: false,
};

const configuration = {};

const client = new MONAIClient();

function addPoint(pointCollectionId, pointData) {
  let points = [];
  if (!state.points.has(pointCollectionId)) {
    state.points.set(pointCollectionId, points);
  } else {
    points = state.points.get(pointCollectionId);
  }

  points.push(pointData);
}

function getPoints(pointCollectionId, frameIndex = undefined) {
  let segmentPoints = undefined;

  const points = state.points.get(pointCollectionId);
  if (points) {
    segmentPoints = {};
    let fg = points.filter(
      p =>
        !p.background && (frameIndex !== undefined ? p.z === frameIndex : true)
    );
    let bg = points.filter(
      p =>
        p.background && (frameIndex !== undefined ? p.z === frameIndex : true)
    );
    segmentPoints.fg = fg.map(p => [p.x, p.y, p.z]);
    segmentPoints.bg = bg.map(p => [p.x, p.y, p.z]);
  }

  return segmentPoints;
}

function removeModelSegmentPoints(SeriesInstanceUID, segmentUid) {
  const pointCollectionId = _getPointCollectionId(
    SeriesInstanceUID,
    segmentUid
  );
  const points = state.points.get(pointCollectionId);
  if (!points) {
    return;
  }
  _clearToolState(points);
  state.points.delete(pointCollectionId);
}

function removeModelAllPoints(SeriesInstanceUID, segmentUids) {
  let allPoints = [];
  const pointCollectionIds = [];
  segmentUids.forEach(segmentUid => {
    const pointCollectionId = _getPointCollectionId(
      SeriesInstanceUID,
      segmentUid
    );
    pointCollectionIds.push(pointCollectionId);
    const points = state.points.get(pointCollectionId);
    if (!points) {
      return;
    }
    allPoints = [...allPoints, ...points];
  });
  _clearToolState(allPoints);
  pointCollectionIds.forEach(id => state.points.delete(id));
}

function removeSegmentAllPoints(segmentUid) {
  const allKys = [...state.points.keys()];
  const pointCollectionIds = allKys.filter(key => key.endsWith(segmentUid));
  let allPoints = [];
  pointCollectionIds.forEach(pointCollectionId => {
    const points = state.points.get(pointCollectionId);
    if (!points) {
      return;
    }
    allPoints = [...allPoints, ...points];
  });
  _clearToolState(allPoints);
  pointCollectionIds.forEach(id => state.points.delete(id));
}

function _clearToolState(points) {
  const toolState = globalToolStateManager.saveToolState();
  points.forEach(p => {
    const toolData =
      toolState[p.imageId] && toolState[p.imageId]['MONAILabelProbeTool'];
    if (!toolData || !toolData.data || !toolData.data.length) {
      return;
    }
    const indexOfData = toolData.data.findIndex(item => item.uuid === p.uuid);
    if (indexOfData >= 0) {
      toolData.data.splice(indexOfData, 1);
    }
  });
}

function _getPointCollectionId(SeriesInstanceUID, segmentUid) {
  const model = client.currentModel;
  const { name: modelName, type: modelType } = model;

  let pointCollectionId = `${SeriesInstanceUID}_${modelName}`;
  if (modelType === MONAI_MODEL_TYPES.DEEPGROW) {
    pointCollectionId += `_${segmentUid}`;
  }

  return pointCollectionId;
}

const getters = {
  points: getPoints,
};

const setters = {
  point: addPoint,
  removeModelSegmentPoints,
  removeModelAllPoints,
  removeSegmentAllPoints,
};

export default {
  state,
  getters,
  setters,
  configuration,
  client,
};
