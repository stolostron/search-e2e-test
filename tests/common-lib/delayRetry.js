// Copyright Contributors to the Open Cluster Management project

const { sleep } = require('./sleep')
// async function delayRetry(validationFn, wait = 1000) {
const delayRetry = async (validationFn, wait = 1000) => {
  try {
    validationFn()
  } catch (e) {
    const start = Date.now()
    console.log(`>>> should wait ${wait} ms before failing and retry. Current time: ${start}`)
    await sleep(wait) // Wait before failing and retry.
    console.log(`>>> done waiting, will fail now. Waited: ${Date.now() - start}  Current time: ${Date.now()}`)
    throw e
  }
}

exports.delayRetry = delayRetry
