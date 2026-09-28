// Copyright Contributors to the Open Cluster Management project

const { TestEnvironment } = require('jest-environment-node')

const RETRY_WAIT_MS = 60000

class RetryWaitEnvironment extends TestEnvironment {
  async handleTestEvent(event) {
    if (event.name === 'test_retry') {
      const testName = event.test.name
      console.log(
        `[RetryWait ${new Date().toISOString()}] Test '${testName}' failed, waiting ${RETRY_WAIT_MS / 1000}s before retry...`
      )
      await new Promise((resolve) => setTimeout(resolve, RETRY_WAIT_MS))
    }
  }
}

module.exports = RetryWaitEnvironment
