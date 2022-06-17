const svgrLoader = {
  test: /\.svg$/,
  use: [{ loader: '@svgr/webpack', options: { titleProp: true } }],
};

module.exports = svgrLoader;
