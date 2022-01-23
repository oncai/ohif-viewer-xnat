import React, { useState, useEffect } from 'react';
import { ReactSlider } from '@xnat-ohif/extension-xnat';

import './VTKRanges.styl';

const VTKOpacityRange = ({ opacity, onOpacityChanged }) => {
  const [value, setValue] = useState(50);

  useEffect(() => {
    setValue(parseInt((opacity * 100).toFixed(0)));
  }, [opacity]);

  return (
    <div className="rangeContainer">
      <div className="labelGroup" title="Background Image">
        <label>0</label>
      </div>
      <ReactSlider
        min={0}
        max={100}
        value={value}
        marks={[50]}
        className="rs-slider widthx2"
        thumbClassName="rs-thumb"
        trackClassName="rs-track"
        markClassName="rs-mark"
        renderThumb={(props, state) => (
          <div {...props}>
            <div className="thumbValue" style={{ top: 20 }}>
              {state.valueNow}%
            </div>
          </div>
        )}
        // onChange={(value, index) => setValue(value)}
        onChange={(value, index) => onOpacityChanged(value)}
      />
      <div className="labelGroup" title="Layer Image">
        <label>100%</label>
      </div>
    </div>
  );
};

export default VTKOpacityRange;
