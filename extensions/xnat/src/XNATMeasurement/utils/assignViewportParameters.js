const assignViewportParameters = (dst, src) => {
  const { translation, scale, voi, invert, rotation, hflip, vflip } = src;

  dst.translation = { ...translation };
  dst.scale = scale;
  dst.voi = { ...voi };
  dst.invert = invert;
  dst.rotation = rotation;
  dst.hflip = hflip;
  dst.vflip = vflip;
};

export default assignViewportParameters;
