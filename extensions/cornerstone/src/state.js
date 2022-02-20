const state = {
  enabledElements: {},
  activeViewportIndex: -1,
};

/**
 * Sets the enabled element `dom` reference for an active viewport.
 * @param {HTMLElement} dom Active viewport element.
 * @return void
 */
const setEnabledElement = (viewportIndex, element) =>
  (state.enabledElements[viewportIndex] = element);

/**
 * Grabs the enabled element `dom` reference of an active viewport.
 *
 * @return {HTMLElement} Active viewport element.
 */
const getEnabledElement = viewportIndex => state.enabledElements[viewportIndex];

const setActiveViewportIndex = viewportIndex => {
  state.activeViewportIndex = viewportIndex;
};

const getActiveViewportIndex = () => state.activeViewportIndex;

export {
  setEnabledElement,
  getEnabledElement,
  setActiveViewportIndex,
  getActiveViewportIndex,
};

/**
 * Windowing state
 */
const windowingState = new Map();

const setWindowing = (enabledElementUuid, type) => {
  windowingState.set(enabledElementUuid, type);
};

const getWindowing = enabledElementUuid => {
  return windowingState.get(enabledElementUuid);
};

export { setWindowing, getWindowing };
