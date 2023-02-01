import cornerstone from 'cornerstone-core';

const imagePlaneDataCache = new Map();

/**
 * extractContourRoiPoints: Extracts contour ROI points in DICOM PCS
 * @param roiMeshProps
 */
const getRoiDataArray = roiMeshProps => {
  const contourArray = [];
  const numPointsArray = [];

  const contours = roiMeshProps.contours;
  Object.keys(contours).forEach(uid => {
    const contour = contours[uid];
    const { row, col, pixDims, pos } = getImagePlaneData(contour.imageId);

    const points = contour.points;
    if (points && points.length > 0) {
      numPointsArray.push(points.length);
      const contourPoints = [];
      contourArray.push(contourPoints);
      points.forEach(p => {
        const x = p.x - 0.5;
        const y = p.y - 0.5;
        const point = [
          pos[0] + x * row[0] * pixDims[0] + y * col[0] * pixDims[1],
          pos[1] + x * row[1] * pixDims[0] + y * col[1] * pixDims[1],
          pos[2] + x * row[2] * pixDims[0] + y * col[2] * pixDims[1],
        ];
        contourPoints.push(point[0], point[1], point[2]);
      });
    }
  });

  if (contourArray.length > 0) {
    const typedDataArray = new Float32Array([
      contourArray.length, // number of contours
      ...numPointsArray,
      ...contourArray.flat(),
    ]);

    return typedDataArray;
  }
};

const getImagePlaneData = imageId => {
  let data = imagePlaneDataCache.get(imageId);
  if (data) {
    return data;
  }

  const imagePlane = cornerstone.metaData.get('imagePlaneModule', imageId);

  const {
    rowCosines: row,
    columnCosines: col,
    pixelSpacing: pixDims,
    imagePositionPatient: pos,
  } = imagePlane;

  // ToDo: use and deal with the following checks.
  // if (!row || !col || !pixDims || !pos) {
  //   throw new Error('Image plane information is missing.');
  // }

  // const magRow =
  //   Math.pow(row[0], 2) + Math.pow(row[1], 2) + Math.pow(row[2], 2);
  // const magCol =
  //   Math.pow(col[0], 2) + Math.pow(col[1], 2) + Math.pow(col[2], 2);
  // if (Math.abs(1.0 - magRow) >= 0.01 || Math.abs(1.0 - magCol) >= 0.01) {
  //   throw new Error('Direction cosines must form unit vectors.');
  // }

  data = { row, col, pixDims, pos };

  imagePlaneDataCache.set(imageId, data);

  return data;
};

export default getRoiDataArray;
