import React, { useState, memo } from 'react';
import { SketchPicker } from 'react-color';
import { Icon } from '@ohif/ui';

import './ROIContourColorPicker.styl';

const ROIContourColorPicker = ({
  ROIContourUid,
  roiContourColor,
  onUpdateROIContourColor,
}) => {
  const [pickerActive, setPickerActive] = useState(false);
  const [currentColor, setCurrentColor] = useState(roiContourColor);
  const [popoverPos, setPopoverPos] = useState('unset');

  const handleClose = () => setPickerActive(false);

  const handleClick = evt => {
    const ratioY = evt.clientY / window.innerHeight;
    if (ratioY > 0.7) {
      setPopoverPos('10px');
    }
    setPickerActive(!pickerActive);
  };

  return (
    <div className="ROIContourColorPicker">
      <div className="swatch" onClick={handleClick}>
        {/*<div className="color" style={{ backgroundColor: color }} />*/}
        <Icon name="palette" />
      </div>
      {pickerActive && (
        <div className="popover" style={{ bottom: popoverPos }}>
          <div className="cover" onClick={handleClose} />
          <SketchPicker
            color={currentColor}
            onChange={setCurrentColor}
            onChangeComplete={newColor =>
              onUpdateROIContourColor({
                color: newColor.hex,
                ROIContourUid,
              })
            }
            width={180}
            // className="picker"
            disableAlpha={true}
            presetColors={[]}
          />
        </div>
      )}
    </div>
  );
};

export default memo(ROIContourColorPicker);
