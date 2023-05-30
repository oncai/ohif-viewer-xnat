import { connect } from 'react-redux';
import OHIF from '@ohif/core';
import imageFusionManager from '../api/ImageFusionManager';
import ImageFusionDialog from './ImageFusionDialog';

const { setViewportSpecificData } = OHIF.redux.actions;

const mapStateToProps = (state, ownProps) => {
  const { viewportSpecificData, activeViewportIndex, layout } = state.viewports;
  const activeViewportSpecificData =
    viewportSpecificData[activeViewportIndex] || {};

  const { imageFusionData } = activeViewportSpecificData;
  if (!imageFusionData) {
    activeViewportSpecificData.imageFusionData = imageFusionManager.getDefaultFusionData();
  }

  return {
    activeViewportIndex,
    viewportSpecificData: activeViewportSpecificData,
    layout,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setViewportFusionData: (viewportIndex, data) => {
      dispatch(
        setViewportSpecificData(viewportIndex, {
          imageFusionData: { ...data },
        })
      );
    },
  };
};

const mergeProps = (propsFromState, propsFromDispatch, ownProps) => {
  const { activeViewportIndex, viewportSpecificData, layout } = propsFromState;

  return {
    activeViewportIndex,
    viewportSpecificData,
    setViewportFusionData: (viewportIndex, data) => {
      propsFromDispatch.setViewportFusionData(viewportIndex, data);
    },
    ...ownProps,
  };
};

const ConnectedImageFusionDialog = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(ImageFusionDialog);

export default ConnectedImageFusionDialog;
