// Copyright Contributors to the Open Cluster Management project

// Jest 30 setup file to replace globals configuration
// This file is loaded after the test framework has been set up

// Set global retry configuration
globalThis.retry = 2
globalThis.retryOptions = {
  waitBeforeRetry: 10000,
  logErrorsBeforeRetry: true,
}

// console.log('Jest setup {retry:', globalThis.retry, ', retryOptions: ', globalThis.retryOptions, '}')
