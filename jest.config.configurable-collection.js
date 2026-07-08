module.exports = {
  globals: {
    retry: 2,
  },
  globalSetup: './globalSetup.js',
  globalTeardown: './globalTeardown.js',
  verbose: true,
  rootDir: './tests/api',
  testMatch: ['**/configurable-collection.test.js'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        suiteName: 'Configurable Collection tests',
        outputDirectory: 'results',
        outputName: 'configurable-collection-tests.xml',
      },
    ],
  ],
  testResultsProcessor: 'jest-junit',
  testRunner: 'jest-circus/runner',
}
