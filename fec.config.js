const plugins = require('./config/plugins.js');

module.exports = {
  appUrl: [
    '/internal/access-requests',
    '/iam/user-access/access-requests',
    '/internal',
  ],
  debug: true,
  useProxy: true,
  proxyVerbose: true,
  sassPrefix: '.accessRequests, .access-requests',
  /**
   * Change to false after your app is registered in configuration files
   */
  interceptChromeConfig: false,
  /**
   * Add additional webpack plugins
   */
  plugins,
  _unstableHotReload: process.env.HOT === 'true',
  moduleFederation: {
    shared: [
      {
        'react-router-dom': {
          singleton: true,
          version: '*',
          requiredVersion: '*',
        },
      },
    ],
  },
};
