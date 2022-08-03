const plugins = require('./config/plugins.js');

module.exports = {
  appUrl: ['/internal/access-requests', '/settings/rbac/access-requests'],
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
  plugins: [...plugins],
};
