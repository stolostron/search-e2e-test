// Copyright Contributors to the Open Cluster Management project

const { getSearchApiRoute } = require('../common-lib/clusterAccess')

module.exports = async () => {
  console.log('Start globalSetup.')
  // process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0 // Disable SSL validation so we can connect to the search-api route.
  await getSearchApiRoute()
  console.log('Done globalSetup.')
}
