module.exports = {
  globals: {
    retry: 2,
  },
  globalSetup: './globalSetup.js',
  globalTeardown: './globalTeardown.js',
  verbose: true,
  rootDir: './tests/api',
  testPathIgnorePatterns: ['/node_modules/', 'configurable-collection.test.js'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        suiteName: 'Search API tests',
        outputDirectory: 'results',
        outputName: 'api-tests.xml',
      },
    ],
  ],
  testResultsProcessor: 'jest-junit',
  testRunner: 'jest-circus/runner',
}
