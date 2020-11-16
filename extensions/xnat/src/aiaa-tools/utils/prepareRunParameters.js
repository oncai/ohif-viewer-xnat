import Model_Types from '../modelTypes.js';


export default function prepareRunParameters(paramsIn) {
  const { model, fgPoints, bgPoints } = paramsIn;
  const output_type = '.nrrd';
  let apiUrl = '';

  const params = {
    result_extension: output_type,
    result_dtype: 'uint16',
    result_compress: true,
  };

  switch (model.type) {
    case Model_Types.ANNOTATION:
      apiUrl = 'dextr3d';
      params.points = fgPoints;
      break;
    case Model_Types.DEEPGROW:
      apiUrl = 'deepgrow';
      params.foreground = fgPoints;
      params.background = bgPoints;
      break;
    case Model_Types.SEGMENTATION:
      apiUrl = 'segmentation';
      break;
  }

  return {apiUrl, params};
}
