import React, { Component } from 'react';

import ConnectedCornerstoneViewport from './ConnectedCornerstoneViewport';
import OHIF from '@ohif/core';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';

// import OHIFCornerstoneViewportOverlay from './components/OHIFCornerstoneViewportOverlay';
import { XNATViewportOverlay } from '@xnat-ohif/extension-xnat';
import './CustomLoader.css';

const { StackManager } = OHIF.utils;

class OHIFCornerstoneViewport extends Component {
  state = {
    viewportData: null,
  };

  static defaultProps = {
    customProps: {},
  };

  static propTypes = {
    studies: PropTypes.object,
    displaySet: PropTypes.object,
    viewportIndex: PropTypes.number,
    children: PropTypes.node,
    customProps: PropTypes.object,
  };

  static id = 'OHIFCornerstoneViewport';

  static init() {
    console.log('OHIFCornerstoneViewport init()');
  }

  static destroy() {
    console.log('OHIFCornerstoneViewport destroy()');
    StackManager.clearStacks();
  }

  /**
   * Obtain the CornerstoneTools Stack for the specified display set.
   *
   * @param {Object[]} studies
   * @param {String} StudyInstanceUID
   * @param {String} displaySetInstanceUID
   * @param {String} [SOPInstanceUID]
   * @param {Number} [frameIndex=1]
   * @return {Object} CornerstoneTools Stack
   */
  static getCornerstoneStack(
    studies,
    StudyInstanceUID,
    displaySetInstanceUID,
    SOPInstanceUID,
    frameIndex = 0
  ) {
    if (!studies || !studies.length) {
      throw new Error('Studies not provided.');
    }

    if (!StudyInstanceUID) {
      throw new Error('StudyInstanceUID not provided.');
    }

    if (!displaySetInstanceUID) {
      throw new Error('StudyInstanceUID not provided.');
    }

    // Create shortcut to displaySet
    const study = studies.find(
      study =>
        study.StudyInstanceUID === StudyInstanceUID &&
        study.displaySets.some(
          ds => ds.displaySetInstanceUID === displaySetInstanceUID
        )
    );

    if (!study) {
      throw new Error('Study not found.');
    }

    const displaySet = study.displaySets.find(set => {
      return set.displaySetInstanceUID === displaySetInstanceUID;
    });

    if (!displaySet) {
      throw new Error('Display Set not found.');
    }

    // Get stack from Stack Manager
    const storedStack = StackManager.findOrCreateStack(study, displaySet);

    // Clone the stack here so we don't mutate it
    const stack = Object.assign({}, storedStack);
    stack.currentImageIdIndex = frameIndex;

    if (displaySet.firstShow) {
      stack.currentImageIdIndex = displaySet.middleImageIndex;
      displaySet.firstShow = false;
      return stack;
    }

    if (SOPInstanceUID && !displaySet.isMultiFrame) {
      const index = stack.imageIds.findIndex(imageId => {
        const imageIdSOPInstanceUID = cornerstone.metaData.get(
          'SOPInstanceUID',
          imageId
        );

        return imageIdSOPInstanceUID === SOPInstanceUID;
      });

      if (index > -1) {
        stack.currentImageIdIndex = index;
      } else {
        console.warn(
          'SOPInstanceUID provided was not found in specified DisplaySet'
        );
      }
    }

    return stack;
  }

  getViewportData = async (
    studies,
    StudyInstanceUID,
    displaySetInstanceUID,
    SOPInstanceUID,
    frameIndex
  ) => {
    let viewportData;

    const stack = OHIFCornerstoneViewport.getCornerstoneStack(
      studies,
      StudyInstanceUID,
      displaySetInstanceUID,
      SOPInstanceUID,
      frameIndex
    );

    viewportData = {
      StudyInstanceUID,
      displaySetInstanceUID,
      stack,
    };

    return viewportData;
  };

  setStateFromProps() {
    const { studies, displaySet } = this.props.viewportData;
    const {
      StudyInstanceUID,
      displaySetInstanceUID,
      sopClassUIDs,
      SOPInstanceUID,
      frameIndex,
    } = displaySet;

    if (!StudyInstanceUID || !displaySetInstanceUID) {
      return;
    }

    if (sopClassUIDs && sopClassUIDs.length > 1) {
      console.warn(
        'More than one SOPClassUID in the same series is not yet supported.'
      );
    }

    this.getViewportData(
      studies,
      StudyInstanceUID,
      displaySetInstanceUID,
      SOPInstanceUID,
      frameIndex
    ).then(viewportData => {
      this.setState({
        viewportData,
      });
    });
  }

  componentDidMount() {
    this.setStateFromProps();
  }

  componentDidUpdate(prevProps) {
    const { displaySet } = this.props.viewportData;
    const prevDisplaySet = prevProps.viewportData.displaySet;

    if (
      displaySet.displaySetInstanceUID !==
        prevDisplaySet.displaySetInstanceUID ||
      displaySet.SOPInstanceUID !== prevDisplaySet.SOPInstanceUID ||
      displaySet.frameIndex !== prevDisplaySet.frameIndex
    ) {
      this.setStateFromProps();
    }
  }

  render() {
    let childrenWithProps = null;

    if (!this.state.viewportData) {
      return null;
    }
    const { viewportIndex } = this.props;
    const { inconsistencyWarnings } = this.props.viewportData.displaySet;
    const {
      imageIds,
      currentImageIdIndex,
      // If this comes from the instance, would be a better default
      // `FrameTime` in the instance
      // frameRate = 0,
    } = this.state.viewportData.stack;

    // TODO: Does it make more sense to use Context?
    if (this.props.children && this.props.children.length) {
      childrenWithProps = this.props.children.map((child, index) => {
        return (
          child &&
          React.cloneElement(child, {
            viewportIndex: this.props.viewportIndex,
            key: index,
          })
        );
      });
    }

    const newImageHandler = ({ currentImageIdIndex, sopInstanceUid }) => {
      const { displaySet } = this.props.viewportData;
      const { StudyInstanceUID } = displaySet;

      if (currentImageIdIndex >= 0) {
        this.props.onNewImage({
          StudyInstanceUID,
          SOPInstanceUID: sopInstanceUid,
          frameIndex: currentImageIdIndex,
          activeViewportIndex: viewportIndex,
          displaySetInstanceUID: displaySet.displaySetInstanceUID,
        });
      }
    };

    const ViewportOverlay = props => {
      return (
        <XNATViewportOverlay
          {...props}
          viewportIndex={viewportIndex}
          // inconsistencyWarnings={inconsistencyWarnings}
        />
      );
    };

    return (
      <>
        <ConnectedCornerstoneViewport
          viewportIndex={viewportIndex}
          imageIds={imageIds}
          imageIdIndex={currentImageIdIndex}
          onNewImageDebounced={newImageHandler}
          onNewImageDebounceTime={300}
          viewportOverlayComponent={ViewportOverlay}
          loadingIndicatorComponent={CustomLoader}
          // ~~ Connected (From REDUX)
          // frameRate={frameRate}
          // isPlaying={false}
          // isStackPrefetchEnabled={true}
          // onElementEnabled={() => {}}
          // setViewportActive{() => {}}
          {...this.props.customProps}
        />
        {childrenWithProps}
      </>
    );
  }
}

class CustomLoader extends Component {
  render() {
    return (
      <div
        style={{
          position: 'absolute',
          top: '47%',
          left: '47%',
          width: '100%',
          height: '100%',
          color: 'white',
        }}
      >
        <div className="loader"></div>
      </div>
    );
  }
}

export default OHIFCornerstoneViewport;
