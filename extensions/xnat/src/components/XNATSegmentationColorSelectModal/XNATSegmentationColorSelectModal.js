import React, { useState, useEffect } from 'react';
import { ChromePicker } from 'react-color';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import './XNATSegmentationColorSelectModal.css';
import colorMaps from '../../constants/colorMaps';

const refreshViewports = () => {
  cornerstoneTools.store.state.enabledElements.forEach(element =>
    cornerstone.updateImage(element)
  );
};

function ColorPicker({ defaultColor = '#fff', onChangeComplete }) {
  const [currentColor, setCurrentColor] = useState(defaultColor);

  useEffect(() => {
    setCurrentColor(defaultColor);
  }, [defaultColor]);

  return (
    <ChromePicker
      color={currentColor}
      onChangeComplete={onChangeComplete}
      onChange={setCurrentColor}
      disableAlpha={true}
    />
  );
}

const segmentationModule = cornerstoneTools.getModule('segmentation');
const { state } = segmentationModule;

export default function XNATSegmentationSelectColorModal({
  labelmap3D,
  segmentIndex,
  onColorChangeCallback,
  onClose,
}) {
  const [colorLUT, setColorLUT] = useState(null);
  const [isColorMap, setIsColorMap] = useState(false);
  const [singleColor, setSingleColor] = useState(undefined);
  const [selectedColorMapLabel, setSelectedColorMapLabel] = useState(null);

  const onSingleColorChangeComplete = color => {
    const { rgb } = color;
    const colorArray = [rgb.r, rgb.g, rgb.b, 255];
    colorLUT[segmentIndex] = colorArray;

    segmentationModule.configuration.fillAlpha = 1.0;
    segmentationModule.configuration.renderOutline = true;

    onColorChangeCallback(colorArray);
    refreshViewports();
  };

  useEffect(() => {
    const { colorLUTIndex } = labelmap3D;
    const activeColorLUT = state.colorLutTables[colorLUTIndex];

    const colorOrColormap = activeColorLUT[segmentIndex];

    let isColorMap = Array.isArray(colorOrColormap[0]);

    let defaultColor;
    let selectedColorMapLabel;

    if (isColorMap) {
      selectedColorMapLabel = colorOrColormap.colorMapLabel;
      debugger;
    } else {
      defaultColor = {
        r: colorOrColormap[0],
        g: colorOrColormap[1],
        b: colorOrColormap[2],
      };
    }

    setColorLUT(activeColorLUT);
    setIsColorMap(isColorMap);
    setSingleColor(defaultColor);
    setSelectedColorMapLabel(selectedColorMapLabel);
  }, []);

  return (
    <div className="xnat-color-select">
      <ColorPicker
        className="color-picker"
        defaultColor={singleColor}
        onChangeComplete={onSingleColorChangeComplete}
      />
      {labelmap3D.isFractional ? (
        <button
          onClick={() => {
            colorLUT[segmentIndex] = colorMaps.MRIWColorMap;
            colorLUT[segmentIndex].colorMapLabel = 'MRIWColorMap';

            segmentationModule.configuration.fillAlpha = 0.5;
            segmentationModule.configuration.renderOutline = false;

            // This is just local, but it make it obvious we aren't using the colormap now.
            setSingleColor({ r: 255, g: 255, b: 255 });
            refreshViewports();
          }}
        >
          TEST COLOR MAP
        </button>
      ) : null}
    </div>
  );
}
