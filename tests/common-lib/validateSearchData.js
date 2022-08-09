// Copyright Contributors to the Open Cluster Management project

const { getResourcesFromSearch } = require('./searchClient')
const { getResourcesFromOC } = require('./index')
const { sleep } = require('./sleep')

/**
 * Common function to validate that the data in search matches
 * the data in Kubernetes.
 * @param {*} kind The resource object kind that will be used for testing.
 * @param {*} apigroup The apigroup of the object kind.
 * @param {*} cluster The cluster of the object kind.
 * @param {*} namespace The namespace of the object kind.
 */
async function ValidateSearchData(
    kind,
    apigroup,
    cluster = { type: 'hub', name: 'local-cluster' },
    namespace = '--all-namespaces'
  ) {
    
    const [kube, search] = await Promise.all([
      getResourcesFromOC(kind, apigroup, namespace, cluster),
      getResourcesFromSearch(kind, apigroup, namespace, cluster)
    ])
  
    var missingInSearch = kube.filter(k => !search.find(s => s.name == k.name))
    var unexpectedInSearch = search.filter(s => !kube.find(k => s.name == k.name))
  
    // TODO: optimization: Check if any missingInSearch resources were created more than 1 minute ago and fail without retry.
  
    for(var retry=1; (missingInSearch.length > 0 || unexpectedInSearch.length > 0) && retry <= 10; retry++){
      console.warn(`Data from search index didn't match the Kube API. Will retry in 5 seconds. Total retries: ${retry}`)
      console.warn(`MissingInSearch: ${missingInSearch} \nUnexpectedInSearch: ${unexpectedInSearch}`)
      await sleep(5000)
  
      const [retryKube, retrySearch] = await Promise.all([
        getResourcesFromOC(kind, apigroup, namespace, cluster),
        getResourcesFromSearch(kind, apigroup, namespace, cluster) 
      ])
  
      // Validate missingInSearch resources using data after retry.
      missingInSearch = missingInSearch.filter(r =>
        // Keep missing resource if it doesn't appear in new search result.
        !retrySearch.find(s => r.name == s.name) ||
        // Keep missing resource if it continues to appear in new kube result.
        retryKube.find(k => r.name == k.name)
      )
  
      // Validate unexpectedInSearch resources using data after retry.
      unexpectedInSearch = unexpectedInSearch.filter(r => 
        // Keep unexpected resource if continues to appear in the new search result.
        retrySearch.find(s => r.name == s.name) || 
        // Keep unexpected resource if it doesn't appear in the new kube result.
        !retryKube.find(k => r.name == k.name))
    }
  
    expect(missingInSearch).toEqual([])
    expect(unexpectedInSearch).toEqual([])
}

exports.ValidateSearchData = ValidateSearchData