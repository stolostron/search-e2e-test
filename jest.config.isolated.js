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
    maxWorkers: 1, // run test files sequentially
    testMatch: [
      '<rootDir>/configurable-collection.test.js',
      '<rootDir>/subscription-limits.test.js',
    ],
  }
  