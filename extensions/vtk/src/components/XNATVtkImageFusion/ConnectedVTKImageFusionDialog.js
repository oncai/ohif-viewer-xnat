import { connect } from 'react-redux';
import OHIF from '@ohif/core';
import VTKImageFusionDialog from './VTKImageFusionDialog';

const { setViewportSpecificData } = OHIF.redux.actions;

const mapStateToProps = (state, ownProps) => {
  const { viewportSpecificData, activeViewportIndex, layout } = state.viewports;

  return {
    activeViewportIndex,
    viewportSpecificData: viewportSpecificData[activeViewportIndex] || {},
    layout,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setViewportFusionData: (viewportIndex, data) => {
      dispatch(
        setViewportSpecificData(viewportIndex, {
          vtkImageFusionData: { ...data },
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
      // Update all viewports
      for (let i = 0; i < layout.viewports.length; i++) {
        propsFromDispatch.setViewportFusionData(i, data);
      }
    },
    ...ownProps,
  };
};

const ConnectedVTKImageFusionDialog = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(VTKImageFusionDialog);

export default ConnectedVTKImageFusionDialog;
