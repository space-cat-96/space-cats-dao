const CracoLessPlugin = require("craco-less");

module.exports = {
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: { "@primary-color": "rgba(93, 82, 252, 0.75)" },
            javascriptEnabled: true,
          },
        },
      },
    },
  ],
};
