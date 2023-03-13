import React, { useState, useEffect } from 'react';
import {
  contourRenderingApi,
  CONTOUR_ROI_EVENTS,
} from '../../utils/contourRois';

const size = 18;
const strokeWidth = size / 2;
const radius = strokeWidth / 2;
const center = size / 2;
const strokeDasharray = radius * 2 * Math.PI;

const computeProgress = value =>
  strokeDasharray - (value / 100) * strokeDasharray;

const ProgressColoredCircle = ({ uid }) => {
  const roi = contourRenderingApi.getRoi(uid);
  const [percentComplete, setPercentComplete] = useState(
    computeProgress(roi.meshProps.reconstructPercent)
  );

  useEffect(() => {
    const callback = evt => {
      const data = evt.detail;
      if (data.uid === uid) {
        setPercentComplete(computeProgress(data.progress));
        evt.stopPropagation();
      }
    };
    document.addEventListener(CONTOUR_ROI_EVENTS.MESH_PROGRESS, callback);

    return () => {
      document.removeEventListener(CONTOUR_ROI_EVENTS.MESH_PROGRESS, callback);
    };
  }, []);

  return (
    <svg height={size} width={size} style={{ verticalAlign: 'middle' }}>
      <circle
        className="roiProgressCircle"
        stroke={roi.color}
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        style={{ strokeDashoffset: `${percentComplete}` }}
        r={radius}
        cx={center}
        cy={center}
      />
    </svg>
  );
};

export default ProgressColoredCircle;
