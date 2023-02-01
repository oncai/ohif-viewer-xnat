import registerWebWorker from 'webworker-promise/lib/register';
import ICRPolySeg from '../lib/ICRPolySeg';

const MESH_PROGRESS_EVENT = 'xnatmprcontourroi:meshprogress';

registerWebWorker(async (message, emit) => {
  const { uid, pointData } = message;

  const dataBuffer = pointData.buffer;
  const numContours = new Float32Array(dataBuffer, 0, 1)[0];
  const numPointsArray = new Float32Array(dataBuffer, 4, numContours).map(
    item => Math.floor(item)
  );
  const flatPointsArray = new Float32Array(dataBuffer, (numContours + 1) * 4);

  const updateProgress = progress => {
    emit(MESH_PROGRESS_EVENT, { uid, progress });
  };

  const icrPolySeg = await ICRPolySeg({ updateProgress: updateProgress });

  const result = icrPolySeg.convert(flatPointsArray, numPointsArray);
  const { points, polys } = result;
  //points: Float32Array
  //polys: Uint32Array

  return new registerWebWorker.TransferableResponse({ points, polys }, [
    points.buffer,
    polys.buffer,
  ]);
});
