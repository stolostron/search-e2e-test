// Copyright Contributors to the Open Cluster Management project

const { getSearchApiRoute } = require('../common-lib/clusterAccess')

module.exports = async () => {
  console.log('Start globalSetup.')
  await getSearchApiRoute()
  console.log('Done globalSetup.')
}
