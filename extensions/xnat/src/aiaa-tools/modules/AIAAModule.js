import AIAAClient from '../client/AIAAClient.js';

const state = {
  points: new Map(),
  menuIsOpen: false,
};

const configuration = {
  ann_minPoints: 6,
};

const client = new AIAAClient();

const getters = {};

const setters = {};

export default {
  state,
  getters,
  setters,
  configuration,
  client,
};