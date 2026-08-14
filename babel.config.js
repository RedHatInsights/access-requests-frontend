module.exports = {
  presets: ['@babel/env', '@babel/react'],
  plugins: [
    '@babel/plugin-transform-runtime',
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-transform-object-rest-spread',
    '@babel/plugin-transform-class-properties',
    'lodash',
  ],
};
