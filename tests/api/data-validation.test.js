// Copyright Contributors to the Open Cluster Management project

jest.retryTimes(global.retry)

const { fail } = require('assert')
const { performance } = require('perf_hooks')

const squad = require('../../config').get('squadName')
const {
  getKubeConfig,
  searchQueryBuilder,
  sendRequest,
} = require('../common-lib/clusterAccess')

const {
  fetchAPIResourcesWithListWatchMethods,
  formatResourcesFromSearch,
  formatFilters,
  getResourcesFromOC,
  getClusterList,
  shouldUseAPIGroup,
} = require('../common-lib/index')

const { sleep } = require('../common-lib/sleep')

// Set list to ignore resources that aren't being collected by Search.
// When using the oc command clusterclaim doesn't include the namespace, therefore, for testing purposes, we will omit that resource object.
const ignoreKindResourceList = [
  'clusterclaim',
  'event',
  'networkattachmentdefinition',
]

// Set list of resources that require filtering by api group.
const requireAPIGroup = []

/**
 * Validate resources in search match the kubernetes API.
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
    console.warn(`Data insearch index didn't match the Kube API. Will retry in 5 seconds. Total retries: ${retry}`)
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


async function getResourcesFromSearch(kind,
  apigroup,
  namespace = '--all-namespaces',
  cluster = { type: 'hub', name: 'local-cluster' }){
  const filters = formatFilters(kind, apigroup, namespace, cluster)

  // Fetch data from the search api.
  var query = searchQueryBuilder({ filters })

  // Monitor how long search took to return results.
  var startTime = performance.now()
  var resp = await sendRequest(query, global.kubeAdminToken)
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

describe('[P2][Sev2] Search API: Validate data in index', () => { 
  // Get kubeconfig for cluster environments.
  var kubeconfigs = getKubeConfig()

  // Generate list of clusters.
  const clusterList = getClusterList(kubeconfigs)

  // Fetch API resources and filter out the kinds that aren't collected by search.
  console.info(
    "Ignoring resources that aren't collected by Search:",
    ignoreKindResourceList
  )
  const resourceList = fetchAPIResourcesWithListWatchMethods().filter(
    (resource) => !ignoreKindResourceList.includes(resource.kind)
  )


  // Run tests for each test cluster environment.
  clusterList.forEach((cluster) => {
    if (!cluster.skip) {
      describe(`for cluster ${cluster.name}`, () => {
        resourceList.forEach((resource) => {
          // There can be multiple occurrences of the same resource kind with different API groups; therefore
          // if we detect multiple versions of the same resource we will then test based upon API groups.
          var group = {
            name: resource.apigroup,
            useAPIGroup: shouldUseAPIGroup(
              resource.kind,
              resourceList,
              requireAPIGroup
            ),
          }
          
          test(`resource ${resource.kind}.${group.name}`,
            async () => ValidateSearchData(resource.kind, group, cluster),
            30000)
        })
      })
    } else {
      console.warn(
        `Detected skip option set to ${cluster.skip}. Proceeding to skip the API test for cluster ${cluster.name} with type ${cluster.type}.`
      )
    }
  })
})
