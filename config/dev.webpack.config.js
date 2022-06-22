const { resolve } = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const config = require('@redhat-cloud-services/frontend-components-config');
const {
  defaultServices,
  rbac,
  backofficeProxy,
} = require('@redhat-cloud-services/frontend-components-config-utilities/standalone');
const commonPlugins = require('./plugins');

const insightsProxy = {
  https: false,
  ...(process.env.BETA && { deployment: 'beta/apps' }),
};

const webpackProxy = {
  deployment: process.env.BETA ? 'beta/apps' : 'apps',
  useProxy: true,
  proxyVerbose: true,
  env: `stage-beta`,
  appUrl: process.env.BETA
    ? ['/beta/internal/access-requests']
    : ['/internal/access-requests'],
};

const standalone = {
  rbac,
  backofficeProxy,
  ...defaultServices,
};

const isProxy = process.env.PROXY || false;
const isInsightsProxy = process.env.INSIGHTS_PROXY || false;

const { config: webpackConfig, plugins } = config({
  rootFolder: resolve(__dirname, '../'),
  debug: true,
  deployment: 'beta/apps',
  ...(isProxy && webpackProxy),
  ...(isInsightsProxy && insightsProxy),
  ...(!isProxy && !isInsightsProxy && { standalone }),
});
plugins.push(...commonPlugins);

module.exports = async (env) => {
  env && env.analyze === 'true' && plugins.push(new BundleAnalyzerPlugin());
  return { ...webpackConfig, plugins }
};
