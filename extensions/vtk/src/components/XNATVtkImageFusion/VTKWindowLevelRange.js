import React, { useState, useEffect, useRef } from 'react';
import { ReactSlider, sliderUtils } from '@xnat-ohif/extension-xnat';
import { volumeCache } from '../../utils/viewportDataCache';

import './VTKRanges.styl';

const { intensityToRange, rangeToIntensity, nFormatter } = sliderUtils;

const VTKWindowLevelRange = ({
  rangeInfo,
  onIntensityRangeChanged,
  modality,
  displaySetInstanceUID,
}) => {
  const { voiRange, dataRange } = rangeInfo;

  const [value, setValue] = useState([]);
  const canvasRef = useRef(null);

  let SF = 1;
  let digits = 0;
  if (modality === 'PT') {
    SF = 10000 / (dataRange[1] - dataRange[0]);
    digits = 2;
  }

  useEffect(() => {
    setValue(intensityToRange(voiRange, SF));

    if (canvasRef.current) {
      updateColorCanvas(
        canvasRef.current,
        [300, 12],
        dataRange,
        displaySetInstanceUID
      );
    }
  }, [SF, dataRange, voiRange]);

  const getStyle = index => {
    let style;
    switch (index) {
      case 0:
        style = { top: 18, left: -24 };
        break;
      case 1:
        style = { top: 18, left: +14 };
        break;
      default:
        style = {};
    }
    return style;
  };

  return (
    <div className="rangeContainer" style={{ alignItems: 'flex-end' }}>
      <div className="labelGroup" title="Background Image">
        <label>{nFormatter(dataRange[0], digits)}</label>
      </div>

      <div>
        <canvas
          ref={canvasRef}
          width={300}
          height={12}
          className="colorCanvas"
        />
        <ReactSlider
          min={intensityToRange(dataRange[0], SF)}
          max={intensityToRange(dataRange[1], SF)}
          value={value}
          movableTrackIndex={1}
          className="rs-slider widthx2"
          thumbClassName="rs-thumb"
          trackClassName="rs-track-wl"
          markClassName="rs-mark"
          pearling
          // snapDragDisabled
          minDistance={100}
          renderTrack={(props, state) => (
            <React.Fragment key={state.index}>
              <div {...props} />
              {state.index === 1 && (
                <div className="trackValue">
                  {rangeToWindowLevel(state.value, SF, digits)}
                </div>
              )}
            </React.Fragment>
          )}
          renderThumb={(props, state) => (
            <div {...props}>
              <div className="thumbValue" style={getStyle(state.index)}>
                {rangeToIntensity(state.valueNow, SF).toFixed(digits)}
              </div>
            </div>
          )}
          // onChange={(value, index) => setValue(value)}
          onChange={(value, index) => {
            const valueArray = rangeToIntensity(value, SF);
            onIntensityRangeChanged(valueArray);
          }}
        />
      </div>

      <div className="labelGroup" title="Layer Image">
        <label>{nFormatter(dataRange[1], digits)}</label>
      </div>
    </div>
  );
};

function rangeToWindowLevel(values, SF, digits) {
  const valueArray = rangeToIntensity(values, SF);
  const ww = valueArray[1] - valueArray[0];
  const wl = ww / 2 + valueArray[0];

  return `W: ${ww.toFixed(digits)} L: ${wl.toFixed(digits)}`;
  //return `W: ${nFormatter(ww, digits)} L: ${nFormatter(wl, digits)}`;
}

function updateColorCanvas(canvas, size, range, displaySetInstanceUID) {
  const volume = volumeCache.get(displaySetInstanceUID);
  if (!volume) {
    return;
  };

  const [width, height] = [...size];
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;

  const lut = volume.getProperty().getRGBTransferFunction(0);


  const rgba = lut.getUint8Table(range[0], range[1], width, true);
  const pixelsArea = ctx.getImageData(0, 0, width, height);
  for (let lineIdx = 0; lineIdx < height; lineIdx++) {
    pixelsArea.data.set(rgba, lineIdx * 4 * width);
  }

  ctx.putImageData(pixelsArea, 0, 0);
}

export default VTKWindowLevelRange;
