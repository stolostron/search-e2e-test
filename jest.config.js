module.exports = {
  globals: {
    retry: 3,
  },
  globalSetup: './globalSetup.js',
  globalTeardown: './globalTeardown.js',
  verbose: true,
  rootDir: './tests/api',
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
