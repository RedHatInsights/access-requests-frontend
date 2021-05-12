const webpack = require('webpack');
const { resolve } = require('path');
const {
  getProxyPaths,
  getHtmlReplacements,
} = require('@redhat-cloud-services/insights-standalone');
const config = require('@redhat-cloud-services/frontend-components-config');

const webpackPort = 8002;
const { config: webpackConfig, plugins } = config({
  rootFolder: resolve(__dirname, '../'),
  debug: true,
  replacePlugin: getHtmlReplacements(),
  port: webpackPort,
});

plugins.push(
  require('@redhat-cloud-services/frontend-components-config/federated-modules')(
    {
      root: resolve(__dirname, '../'),
      useFileHash: false,
      exposes: {
        './RootApp': resolve(__dirname, '../src/AppEntry'),
      },
    }
  ),
  new webpack.DefinePlugin({
    API_BASE: JSON.stringify('/api/rbac/v1'),
  })
);

webpackConfig.devServer.hot = false;
webpackConfig.devServer.proxy = getProxyPaths({ webpackPort });

module.exports = {
  ...webpackConfig,
  plugins,
};
