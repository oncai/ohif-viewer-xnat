import React, { useState, useEffect } from 'react';
import { ChromePicker } from 'react-color';
import XNATColorMapSelect from './XNATColorMapSelect';
import XNATColorMapSelectItem from './XNATColorMapSelectItem';
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
}) {
  const [colorLUT, setColorLUT] = useState(null);
  const [isColorMap, setIsColorMap] = useState(false);
  const [singleColor, setSingleColor] = useState(undefined);
  const [selectedColorMapID, setSelectedColorMapID] = useState(null);

  const onSingleColorChangeComplete = color => {
    const { rgb } = color;
    const colorArray = [rgb.r, rgb.g, rgb.b, 255];
    colorLUT[segmentIndex] = colorArray;

    if (isColorMap) {
      segmentationModule.configuration.fillAlpha = 1.0;
      segmentationModule.configuration.renderOutline = true;
    }

    onColorChangeCallback(colorArray);
    setSelectedColorMapID(null);
    refreshViewports();
  };

  const colorMapList = colorMaps.map(cm => {
    const { title, description, colormap, ID } = cm;

    return {
      value: ID,
      title,
      description,
      onClick: () => {
        colorLUT[segmentIndex] = colormap;
        colorLUT[segmentIndex].ID = ID;

        if (segmentationModule.configuration.fillAlpha === 1) {
          segmentationModule.configuration.fillAlpha = 0.5;
        }

        segmentationModule.configuration.renderOutline = false;

        // This is just local, but it make it obvious we aren't using the colormap now.
        setSingleColor({ r: 0, g: 0, b: 0 });

        const highestColorArray = colormap[colormap.length - 1];

        onColorChangeCallback(highestColorArray);
        setSelectedColorMapID(ID);
        refreshViewports();
        // TODO logic
      },
    };
  });

  useEffect(() => {
    const { colorLUTIndex } = labelmap3D;
    const activeColorLUT = state.colorLutTables[colorLUTIndex];

    const colorOrColormap = activeColorLUT[segmentIndex];

    const isColorMap = Array.isArray(colorOrColormap[0]);

    let defaultColor;
    let defaultSelectedColorMapID;

    if (isColorMap) {
      defaultSelectedColorMapID = colorOrColormap.ID;
    } else {
      defaultColor = {
        r: colorOrColormap[0],
        g: colorOrColormap[1],
        b: colorOrColormap[2],
      };
    }

    debugger;

    setColorLUT(activeColorLUT);
    setIsColorMap(isColorMap);
    setSingleColor(defaultColor);
    setSelectedColorMapID(defaultSelectedColorMapID);
  }, []);

  const defaultColorMapValue = selectedColorMapID
    ? colorMapList.find(cm => cm.value === selectedColorMapID)
    : null;

  return (
    <div className="xnat-color-select">
      <ColorPicker
        className="color-picker"
        defaultColor={singleColor}
        onChangeComplete={onSingleColorChangeComplete}
      />
      {labelmap3D.isFractional ? (
        <XNATColorMapSelect
          value={defaultColorMapValue}
          formatOptionLabel={XNATColorMapSelectItem}
          options={colorMapList}
        />
      ) : null}
    </div>
  );
}

// onChange={setSelectedColorMapID}

// {selectedColorMapID}
