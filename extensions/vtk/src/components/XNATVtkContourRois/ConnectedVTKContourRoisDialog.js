import { connect } from 'react-redux';
import OHIF from '@ohif/core';
import VTKContourRoisDialog from './VTKContourRoisDialog';

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
    setViewportContourRoisData: (viewportIndex, data) => {
      dispatch(
        setViewportSpecificData(viewportIndex, {
          vtkContourRoisData: { ...data },
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
    setViewportContourRoisData: (viewportIndex, data) => {
      // Update all viewports
      for (let i = 0; i < layout.viewports.length; i++) {
        propsFromDispatch.setViewportContourRoisData(i, data);
      }
    },
    ...ownProps,
  };
};

const ConnectedVTKContourRoisDialog = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(VTKContourRoisDialog);

export default ConnectedVTKContourRoisDialog;
