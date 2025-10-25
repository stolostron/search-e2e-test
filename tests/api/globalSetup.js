// Copyright Contributors to the Open Cluster Management project

const { getSearchApiRoute } = require('../common-lib/clusterAccess')

/**
 * Used to capture metrics from the search requests to evaluate performace.
 * @object { startTime, endTime, time, firstRequest, operation, variables }
 */
global.metrics = []

module.exports = async () => {
  await getSearchApiRoute()
}
