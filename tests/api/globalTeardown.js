// Copyright Contributors to the Open Cluster Management project

const { execSync } = require('child_process')

module.exports = () => {
  const namespace = execSync(`oc get mch -A -o jsonpath='{.items[0].metadata.namespace}'`).toString()
  execSync(`oc delete route search-api-automation -n ${namespace} --ignore-not-found`)
  console.log('Deleted route search-api-automation.')

  const totalRequests = global.metrics.length
  const totalSlowRequests = global.metrics.filter((r) => {
    r.time > 1000
  })
  const totalFirstRequests = global.metrics.filter((r) => {
    r.firstRequest
  }).length
  const averageRequestTime = global.metrics.reduce((acc, r) => acc + r.time, 0) / totalRequests
  const averageFirstRequestTime =
    global.metrics
      .filter((r) => {
        r.firstRequest
      })
      .reduce((acc, r) => acc + r.time, 0) / totalFirstRequests

  console.log('\n*** Search-api request metrics ***')
  console.log(`  Total requests:\t ${totalRequests}`)
  console.log(`  First requests:\t ${totalFirstRequests}`)
  console.log(`  Slow  requests:\t ${totalSlowRequests.length}`)
  console.log(`  Average request time:\t ${averageRequestTime.toFixed(2)} ms`)
  console.log(`  Average first request time:\t ${averageFirstRequestTime.toFixed(2)} ms`)
}
