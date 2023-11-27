import cornerstone from 'cornerstone-core';

const checkAndFixVoi = image => {
  if (isNaN(image.windowCenter) || isNaN(image.windowWidth)) {
    const { WindowCenter, WindowWidth } = cornerstone.metaData.get(
      'instance',
      image.imageId
    );
    image.windowCenter = WindowCenter || 80;
    image.windowWidth = WindowWidth || 400;
  }
};

export default checkAndFixVoi;
