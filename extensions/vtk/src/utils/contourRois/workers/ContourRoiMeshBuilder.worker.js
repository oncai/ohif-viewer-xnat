import registerWebWorker from 'webworker-promise/lib/register';
import ICRPolySeg from '../lib/ICRPolySeg';

registerWebWorker(async (message, emit) => {
  const { uid, pointData } = message;

  const dataBuffer = pointData.buffer;
  const numContours = new Float32Array(dataBuffer, 0, 1)[0];
  const numPointsArray = new Float32Array(dataBuffer, 4, numContours).map(
    item => Math.floor(item)
  );
  const flatPointsArray = new Float32Array(dataBuffer, (numContours + 1) * 4);

  // https://github.com/apache/cordova/issues/93
  self.document = {
    dispatchEvent: event => {
      const percentageFinished = event.detail.percentageFinished;
      emit('roimeshbuilder:progress', { uid, progress: percentageFinished });
    },
  };

  const icrPolySeg = await ICRPolySeg();

  const result = icrPolySeg.convert(flatPointsArray, numPointsArray);
  const { points, polys } = result;
  //points: Float32Array
  //polys: Uint32Array

  return new registerWebWorker.TransferableResponse({ points, polys }, [
    points.buffer,
    polys.buffer,
  ]);
});
