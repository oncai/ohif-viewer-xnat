import { isEmpty } from 'lodash';

const assignViewportParameters = (dst, src) => {
  const { translation, scale, voi, invert, rotation, hflip, vflip } = src;

  if (!isEmpty(dst)) {
    dst.translation = { ...translation };
    dst.scale = scale;
    dst.voi = { ...voi };
    dst.invert = invert;
    dst.rotation = rotation;
    dst.hflip = hflip;
    dst.vflip = vflip;
  } else {
    return {
      translation: { ...translation },
      scale,
      voi: { ...voi },
      invert,
      rotation,
      hflip,
      vflip,
    };
  }
};

export default assignViewportParameters;
