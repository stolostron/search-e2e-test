// Copyright Contributors to the Open Cluster Management project

const { execSync } = require('child_process')

module.exports = () => {
  const namespace = execSync(`oc get mch -A -o jsonpath='{.items[0].metadata.namespace}'`).toString()
  execSync(`oc delete networkpolicy search-api-e2e-route-access -n ${namespace} --ignore-not-found`)
  console.log('globalTeardown.js - Deleted NetworkPolicy search-api-e2e-route-access.')
  execSync(`oc delete route search-api-automation -n ${namespace} --ignore-not-found`)
  console.log('globalTeardown.js - Deleted route search-api-automation.')
}
