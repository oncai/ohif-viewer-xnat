import AIAAClient from '../client/AIAAClient.js';
import AIAA_MODEL_TYPES from '../modelTypes.js';

const state = {
  points: new Map(),
  menuIsOpen: false,
};

const configuration = {
  annotationMinPoints: 6,
  annotationPointColors: ['yellow'],
  deepgrowPointColors: ['red', 'blue'],
};

const client = new AIAAClient();

const getters = {};

const setters = {
  points: setPoints,
};

function setPoints(toolType, segmentUid, pointData) {
  let points;
  if (!state.points.has(segmentUid)) {
    points = [];
    state.points.set(segmentUid, points);
  } else {
    points = state.points.get(segmentUid);
  }

  points.push({
    toolType: toolType,
    pos: [pointData.x, pointData.y, pointData.z],
    background: pointData.background,
  });

  /*
  let segments = [];
  if (!state.points.has(SeriesInstanceUID)) {
    state.points.set(SeriesInstanceUID, segments);
  } else {
    segments = state.points.get(SeriesInstanceUID);
  }

  let segIndex = segments.findIndex(seg => {
    return seg.uid === segmentUid;
  });

  if (segIndex < 0) {
    segments.push({
      uid: segmentUid,
      fg: [], // foreground points
      bg: [], // background points
    });
    segIndex = 0;
  }

  const pointArray = pointData.background ?
    segments[segIndex].bg : segments[segIndex].fg;

  pointArray.push([
    pointData.x, pointData.y, pointData.z
  ]);
  */
}

function getPoints(SeriesInstanceUID, segmentUid) {
  let points = [];
}

export default {
  state,
  getters,
  setters,
  configuration,
  client,
};