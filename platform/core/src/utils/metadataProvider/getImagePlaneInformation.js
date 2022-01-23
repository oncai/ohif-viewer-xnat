import { Vector3 } from 'cornerstone-math';

export default function getImagePlaneInformation(instance, frameIndex) {
  let ImageOrientationPatient;
  let ImagePositionPatient;

  const { Modality } = instance;

  if (Modality === 'NM') {
    const {
      ImageType,
      NumberOfDetectors,
      FrameIncrementPointer,
      SliceVector,
      SpacingBetweenSlices,
      SliceThickness,
      DetectorInformationSequence,
    } = instance;

    if (ImageType[3] && ImageType[2] === 'RECON TOMO') {
      if (
        NumberOfDetectors === 1 &&
        DetectorInformationSequence !== undefined &&
        FrameIncrementPointer === 5505152 // (0054,0080) SliceVector
      ) {
        const {
          ImageOrientationPatient: iop,
          ImagePositionPatient: ipp,
        } = DetectorInformationSequence;

        const axisNormal = new Vector3(iop[0], iop[1], iop[2]).cross(
          new Vector3(iop[3], iop[4], iop[5])
        );

        let incremant;
        if (SpacingBetweenSlices) {
          incremant = SpacingBetweenSlices;
        } else if (SliceThickness) {
          incremant = SliceThickness;
        }

        if (incremant) {
          axisNormal.multiplyScalar(incremant);
        }

        ImageOrientationPatient = iop;
        ImagePositionPatient = [
          axisNormal.x * frameIndex + ipp[0],
          axisNormal.y * frameIndex + ipp[1],
          axisNormal.z * frameIndex + ipp[2],
        ];
      }
    }
  }

  return {
    ImageOrientationPatient,
    ImagePositionPatient,
  };
}
