module.exports = {
  coverageDirectory: './coverage/',
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js', '!src/entry.js', '!src/entry-dev.js'],
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!(@patternfly/react-core/|@patternfly/react-icons/|@redhat-cloud-services|@patternfly/react-table|@patternfly/react-tokens)).*$',
  ],
  setupFiles: ['<rootDir>/config/setupTests.js'],
  roots: ['<rootDir>/src/'],
  moduleFileExtensions: ['js', 'jsx'],
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy',
    customReact: 'react',
    PFReactCore: '@patternfly/react-core',
    PFReactTable: '@patternfly/react-table',
    reactRedux: 'react-redux',
  },
};
