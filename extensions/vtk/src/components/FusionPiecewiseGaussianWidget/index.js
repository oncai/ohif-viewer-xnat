import React from 'react';
import PropTypes from 'prop-types';
import vtkPiecewiseGaussianWidget from './vtkPiecewiseGaussianWidget';
import volumeProperties from '../../utils/volumeProperties';
import vtkColorMaps from '../../utils/colorMaps/ColorMaps';

class FusionPiecewiseGaussianWidget extends React.PureComponent {
  constructor(props) {
    super(props);

    this.pwgWidgetContainerRef = React.createRef();
  }

  componentDidMount() {
    this.setupPwgWidget();
  }

  setupPwgWidget() {
    const { displaySetInstanceUID } = this.props;
    const volume = volumeProperties.getVolume(displaySetInstanceUID);
    const _properties = volumeProperties.getProperties(displaySetInstanceUID);

    if (!volume || !_properties) {
      return;
    }

    const { dataRange, user } = _properties;
    const { color, colormap } = user.fg;

    const piecewiseSize = 256;
    const widget = vtkPiecewiseGaussianWidget.newInstance({
      numberOfBins: 256,
      size: [450, 150],
    });

    widget.setPiecewiseSize(piecewiseSize);

    widget.updateStyle({
      backgroundColor: 'rgba(255, 255, 255, 0.6)',
      histogramColor: 'rgba(100, 100, 100, 0.5)',
      strokeColor: 'rgb(0, 0, 0)',
      activeColor: 'rgb(255, 255, 255)',
      handleColor: 'rgb(50, 150, 50)',
      buttonDisableFillColor: 'rgba(255, 255, 255, 0.5)',
      buttonDisableStrokeColor: 'rgba(0, 0, 0, 0.5)',
      buttonStrokeColor: 'rgba(0, 0, 0, 1)',
      buttonFillColor: 'rgba(255, 255, 255, 1)',
      strokeWidth: 2,
      activeStrokeWidth: 3,
      buttonStrokeWidth: 1.5,
      handleWidth: 3,
      iconSize: 0,
      padding: 10,
      zoomControlColor: '#20A5D6',
    });

    const setGaussian = () => {
      const _dataRange = dataRange[1] - dataRange[0];
      const colorRange = color[1] - color[0];
      const colorCenter = colorRange / 2;
      const position = (color[0] + colorCenter) / _dataRange;
      const height = 1.0;
      const width = colorRange / _dataRange;
      widget.addGaussian(position, height, width, 0.5, 0.5);
    };

    setGaussian();
    // widget.addGaussian(0.5, 1.0, 0.5, 0.5, 0.4);
    // widget.addGaussian(0.425, 0.5, 0.2, 0.3, 0.2);
    // widget.addGaussian(0.75, 1, 0.3, 0, 0);
    widget.setDataRange(dataRange);
    widget.setContainer(this.pwgWidgetContainerRef.current);
    widget.bindMouseListeners();

    const lookupTable = volume.getProperty().getRGBTransferFunction(0);
    const piecewiseFunction = volume.getProperty().getScalarOpacity(0);

    widget.setColorTransferFunction(lookupTable);
    widget.applyOpacity(piecewiseFunction);

    widget.onOpacityChange(() => {
      // const rescaleColorMap = false;
      widget.applyOpacity(piecewiseFunction);
      // if (rescaleColorMap) {
      //   const colorDataRange = widget.getOpacityRange();
      //   const preset = vtkColorMaps.getPresetByName(colormap);
      //   lookupTable.applyColorMap(preset);
      //   lookupTable.setMappingRange(...colorDataRange);
      //   lookupTable.updateRange();
      // }

      this.props.commandsManager.runCommand('updateVtkApi');
    });

    this.colorDataRange = widget.getOpacityRange();
    this.pwgWidget = widget;
    // this.props.commandsManager.runCommand('updateVtkApi');
  }

  render() {
    return (
      <>
        <div className="pwgWidget" ref={this.pwgWidgetContainerRef} />
      </>
    );
  }
}

FusionPiecewiseGaussianWidget.propTypes = {
  displaySetInstanceUID: PropTypes.string.isRequired,
  commandsManager: PropTypes.object.isRequired,
};

export default FusionPiecewiseGaussianWidget;
