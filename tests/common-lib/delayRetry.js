// Copyright Contributors to the Open Cluster Management project

const { sleep } = require('./sleep')

const delayRetry = async (validationFn, wait = 1000) => {
  try {
    validationFn()
  } catch (e) {
    const start = Date.now()
    console.log(`Waiting ${wait} ms before failing the test to delay the retry. Current time: ${start}`)
    await sleep(wait) // Wait before failing and retry.
    console.log(`Failing the test. Waited: ${Date.now() - start}  Current time: ${Date.now()}`)
    throw e
  }
}

exports.delayRetry = delayRetry
