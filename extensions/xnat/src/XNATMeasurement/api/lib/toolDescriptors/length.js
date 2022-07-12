import React from 'react';

const updateMetadata = data => {
  const meta = data.xnatMetadata;
  if (meta) {
    meta.length = data.length;
    meta.unit = data.unit;
  }
};

const displayFunction = meta => {
  let displayText = null;
  if (meta && meta.length && !isNaN(meta.length)) {
    displayText = (
      <div>
        <span>{meta.length.toFixed(2)}</span>
        {meta.unit && (
          <span
            style={{ color: 'var(--text-secondary-color)', display: 'block' }}
          >
            {meta.unit}
          </span>
        )}
      </div>
    );
  }
  return displayText;
};

export const length = {
  id: 'Length',
  name: 'Length',
  toolGroup: 'allTools',
  cornerstoneToolType: 'Length',
  icon: 'measure-temp',
  options: {
    updateMetadata,
    displayFunction,
    caseProgress: {
      include: true,
      evaluate: true,
    },
  },
};
