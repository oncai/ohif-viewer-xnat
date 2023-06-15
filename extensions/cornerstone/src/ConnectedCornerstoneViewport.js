import React from 'react';
import cornerstone from 'cornerstone-core';
import CornerstoneViewport from 'react-cornerstone-viewport';
import OHIF from '@ohif/core';
import { connect } from 'react-redux';
import throttle from 'lodash.throttle';
import {
  setEnabledElement,
  getEnabledElement,
  setActiveViewportIndex,
  getActiveViewportIndex,
  setWindowing,
  getWindowing,
} from './state';
import {
  referenceLines,
  updateImageSynchronizer,
  XNATViewportOverlay,
} from '@xnat-ohif/extension-xnat';
import getDisplayedArea from './utils/getDisplayedArea';

const { setViewportActive, setViewportSpecificData } = OHIF.redux.actions;
const {
  onAdded,
  onRemoved,
  onModified,
} = OHIF.measurements.MeasurementHandlers;

const imageLoadFailed = event => {
  const servicesManager = window.ohif.app.servicesManager;
  const { UINotificationService } = servicesManager.services;

  if (UINotificationService) {
    const detail = event.detail || {};
    const error = detail.error || {};
    let message = error.message || 'Unknown error.';
    UINotificationService.show({
      title: 'Error displaying the current frame',
      message: message,
      type: 'error',
    });
  }
};

const onImageLoaded = event => {
  // The displayedArea is image specific, so associate it with the image rather than the viewport.
  const eventDetail = event.detail;
  if (!eventDetail) {
    return;
  }

  const { image } = eventDetail;
  if (!image) {
    return;
  }

  image.displayedArea = getDisplayedArea(image);
};

const onNewImage = event => {
  // Make sure to update the viewport with the correct voi values.
  const eventDetail = event.detail;
  if (!eventDetail) {
    return;
  }

  const { viewport, image, enabledElement, element } = eventDetail;
  if (!viewport || !image || !enabledElement) {
    return;
  }

  if (getWindowing(enabledElement.uuid) !== 'Default') {
    return;
  }

  const voi = viewport.voi;
  const { windowWidth, windowCenter } = image;

  if (windowWidth !== voi.windowWidth || windowCenter !== voi.windowCenter) {
    voi.windowWidth = windowWidth;
    voi.windowCenter = windowCenter;
    cornerstone.setViewport(element, viewport);
  }
};

const onPreRender = event => {
  // Workaround to update the viewport with the image specific displayedArea
  const eventDetail = event.detail;
  if (!eventDetail || !eventDetail.enabledElement) {
    return;
  }

  const { viewport, image } = eventDetail.enabledElement;
  if (!viewport || !image) {
    return;
  }

  viewport.displayedArea = image.displayedArea;
};

// TODO: Transition to enums for the action names so that we can ensure they stay up to date
// everywhere they're used.
const MEASUREMENT_ACTION_MAP = {
  added: onAdded,
  removed: onRemoved,
  modified: throttle(event => {
    return onModified(event);
  }, 300),
};

const mapStateToProps = (state, ownProps) => {
  let dataFromStore;

  // TODO: This may not be updated anymore :thinking:
  if (state.extensions && state.extensions.cornerstone) {
    dataFromStore = state.extensions.cornerstone;
  }

  // If this is the active viewport, enable prefetching.
  const { viewportIndex } = ownProps; //.viewportData;
  const isActive = viewportIndex === state.viewports.activeViewportIndex;
  if (isActive) {
    setActiveViewportIndex(viewportIndex);
  }
  const viewportSpecificData =
    state.viewports.viewportSpecificData[viewportIndex] || {};

  // CINE
  let isPlaying = false;
  let frameRate = 24;

  if (viewportSpecificData && viewportSpecificData.cine) {
    const cine = viewportSpecificData.cine;

    isPlaying = cine.isPlaying === true;
    frameRate = cine.cineFrameRate || frameRate;
  }

  return {
    // layout: state.viewports.layout,
    isActive,
    // TODO: Need a cleaner and more versatile way.
    // Currently justing using escape hatch + commands
    // activeTool: activeButton && activeButton.command,
    ...dataFromStore,
    isStackPrefetchEnabled: isActive,
    isPlaying,
    frameRate,
    //stack: viewportSpecificData.stack,
    // viewport: viewportSpecificData.viewport,
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  const { viewportIndex } = ownProps;

  return {
    setViewportActive: () => {
      // Fire dispatch only when switching viewports
      if (viewportIndex !== getActiveViewportIndex()) {
        dispatch(setViewportActive(viewportIndex));
        referenceLines.display(viewportIndex);
      }
    },

    setViewportSpecificData: data => {
      dispatch(setViewportSpecificData(viewportIndex, data));
    },

    /**
     * Our component "enables" the underlying dom element on "componentDidMount"
     * It listens for that event, and then emits the enabledElement. We can grab
     * a reference to it here, to make playing with cornerstone's native methods
     * easier.
     */
    onElementEnabled: event => {
      const enabledElement = event.detail.element;
      setEnabledElement(viewportIndex, enabledElement);
      setWindowing(event.detail.uuid, 'Default');
      updateImageSynchronizer.add(enabledElement);
      setTimeout(() => {
        referenceLines.display(getActiveViewportIndex());
      }, 500);
      dispatch(
        setViewportSpecificData(viewportIndex, {
          // TODO: Hack to make sure our plugin info is available from the outset
          plugin: 'cornerstone',
        })
      );
    },

    onMeasurementsChanged: (event, action) => {
      return MEASUREMENT_ACTION_MAP[action](event);
    },
    eventListeners: [
      {
        target: 'element',
        eventName: cornerstone.EVENTS.IMAGE_LOAD_FAILED,
        handler: imageLoadFailed,
      },
      {
        target: 'element',
        eventName: cornerstone.EVENTS.ELEMENT_DISABLED,
        handler: event => {
          updateImageSynchronizer.remove(event.detail.element);
        },
      },
      {
        target: 'element',
        eventName: cornerstone.EVENTS.NEW_IMAGE,
        handler: onNewImage,
      },
      {
        target: 'element',
        eventName: cornerstone.EVENTS.IMAGE_LOADED,
        handler: onImageLoaded,
      },
      {
        target: 'element',
        eventName: cornerstone.EVENTS.PRE_RENDER,
        handler: onPreRender,
      },
    ],
  };
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { viewportIndex, getWindowing } = ownProps;
  const { setViewportActive } = dispatchProps;

  const ViewportOverlay = props => {
    return (
      <XNATViewportOverlay
        {...props}
        viewportIndex={viewportIndex}
        getWindowing={getWindowing}
        setViewportActive={setViewportActive}
        getEnabledElement={getEnabledElement}
      />
    );
  };

  return {
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
    viewportOverlayComponent: ViewportOverlay,
  };
};

const ConnectedCornerstoneViewport = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(CornerstoneViewport);

export default ConnectedCornerstoneViewport;
