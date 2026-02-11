module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
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
}
