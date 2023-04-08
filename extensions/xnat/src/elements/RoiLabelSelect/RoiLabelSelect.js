import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import sessionMap from '../../utils/sessionMap';

import './RoiLabelSelect.styl';

const RoiLabelSelect = props => {
  const { value } = props;

  const roiPreset = useMemo(
    () => sessionMap.getProjectRoiPreset(props.roiType),
    [props.roiType]
  );

  const onInputChange = useCallback(
    (newValue, action) => {
      let label = newValue;
      if (action === 'select-input') {
        // Get label from value
        const roi = roiPreset.find(roi => roi.value === newValue);
        label = roi !== undefined ? roi.label : '';
      }
      props.onChange(label);
    },
    [roiPreset]
  );

  return (
    <div
      className={`RoiLabelContainer${
        value.length > 0 && value.length <= 64 ? '' : ' invalid'
      }`}
    >
      <div className="inputWrapper">
        <input
          type="text"
          value={value}
          maxLength={64}
          onChange={evt => onInputChange(evt.target.value, 'text-input')}
        />
        {value.length > 0 && (
          <button onClick={() => onInputChange('', 'clear-input')}>x</button>
        )}
      </div>
      {roiPreset.length > 0 && (
        <select
          value={value.trim().toLowerCase()}
          onChange={evt => onInputChange(evt.target.value, 'select-input')}
        >
          {roiPreset.map((roi, index) => (
            <option
              key={index}
              value={roi.value}
              label={roi.label}
              hidden={roi.value === ''}
            />
          ))}
        </select>
      )}
    </div>
  );
};

RoiLabelSelect.propTypes = {
  value: PropTypes.string,
  roiType: PropTypes.string,
  onChange: PropTypes.func,
};

export default RoiLabelSelect;
