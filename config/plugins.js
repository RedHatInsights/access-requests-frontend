const { resolve } = require('path');
const webpack = require('webpack');

module.exports = [
  new webpack.DefinePlugin({
    API_BASE: JSON.stringify('/api/rbac/v1'),
  }),
];
