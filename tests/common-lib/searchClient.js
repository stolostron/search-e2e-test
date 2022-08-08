// Copyright Contributors to the Open Cluster Management project

const { fail } = require('assert')
const { performance } = require('perf_hooks')
const {
    searchQueryBuilder,
    sendRequest } = require('./clusterAccess')
    
const {
    formatResourcesFromSearch,
    formatFilters } = require('./index')


async function getResourcesFromSearch(kind,
    apigroup,
    namespace = '--all-namespaces',
    cluster = { type: 'hub', name: 'local-cluster' }){
    const filters = formatFilters(kind, apigroup, namespace, cluster)
  
    // Fetch data from the search api.
    var query = searchQueryBuilder({ filters })
  
    // Monitor how long search took to return results.
    var startTime = performance.now()
    var resp = await sendRequest(query, token)
    var endTime = performance.now()
    var totalElapsedTime = endTime - startTime
  
    if (totalElapsedTime > 30000) {
      fail(
        `Search required more than 30 seconds to return resources for ${kind}. (TotalElapsedTime: ${totalElapsedTime})`
      )
    } else if (totalElapsedTime > 1000) {
      console.warn(
        `Search required more than 1 second to return resources for ${kind}. (TotalElapsedTime: ${totalElapsedTime.toFixed(
          2
        )})`
      )
    }
  
    return formatResourcesFromSearch(resp)
  }

exports.getResourcesFromSearch = getResourcesFromSearch