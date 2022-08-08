// Copyright Contributors to the Open Cluster Management project

jest.retryTimes(global.retry)

const { fail } = require('assert')
const { performance } = require('perf_hooks')
// const { runInThisContext } = require('vm')

const squad = require('../../config').get('squadName')
const {
  getKubeConfig,
  getSearchApiRoute,
  getToken,
  searchQueryBuilder,
  sendRequest,
} = require('../common-lib/clusterAccess')

const {
  // closeMatch,
  fetchAPIResourcesWithListWatchMethods,
  formatResourcesFromSearch,
  formatFilters,
  // getMismatchResources,
  getResourcesFromOC,
  getClusterList,
  // matchPerc,
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
 * Validate resources in search match kubernetes.
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
  console.log("Validating resource: ", kind, apigroup.name)
  
  const kube = await getResourcesFromOC(kind, apigroup, namespace, cluster)
  // console.log("kube: ", kube)

  const search = await getResourcesFromSearch(kind, apigroup, namespace, cluster)
  // const [kube, search] = await Promise.all([
  //   getResourcesFromOC(kind, apigroup, namespace, cluster),
  //   getResourcesFromSearch(kind, apigroup, namespace, cluster)
  // ])


  console.log("search results: ", search)

  var missingInSearch = kube.filter(k => !search.find(s => s.name == k.name))
  var unexpectedInSearch = search.filter(s => !kube.find(k => s.name == k.name))

  console.log("missingInSearch: ", missingInSearch)
  console.log("unexpectedInSearch: ", unexpectedInSearch)

  for(var retry=1; retry <= 10 && (missingInSearch.length > 0 || unexpectedInSearch.length > 0); retry++){
    console.log("^^ Retrying in 5 seconds.")
    await sleep(5000)

    const [retryKube, retrySearch] = await Promise.all([
      async () => getResourcesFromOC(kind, apigroup, namespace, cluster),
      getResourcesFromSearch(kind, apigroup, namespace, cluster) 
    ])

    // Update missing resources after retry.
    missingInSearch = missingInSearch.filter(r =>
      // Missing resource is still not in the new search result.
      !retrySearch.find(s => r.name == s.name) ||
      // Missing resource is still present in the kube result.
      retryKube.find(k => r.name == k.name)
    )

    // Update unexpected resources after retry.
    unexpectedInSearch = unexpectedInSearch.filter(r => 
      // Unexpected resource continues to appear in the search result.
      retrySearch.find(s => r.name == s.name) || 
      // Unexpected resource is no longer in the kube results.
      !retryKube.find(k => r.name == k.name))
  }

  expect(missingInSearch).toBe([])
  expect(unexpectedInSearch).toBe([])
}


async function getResourcesFromSearch(kind,
  apigroup,
  cluster = { type: 'hub', name: 'local-cluster' },
  namespace = '--all-namespaces'){
  const filters = formatFilters(kind, apigroup, namespace, cluster)

  // Fetch data from the search api.
  var query = searchQueryBuilder({ filters })

  // Monitor how long search took to return results.
  var startTime = performance.now()
  console.log("Sending search request for: ", kind)
  var resp = await sendRequest(query, token)
  console.log("Got search response for: ", kind)
  var endTime = performance.now()
  var totalElapsedTime = endTime - startTime

  if (totalElapsedTime > 30000) {
    fail(
      `Search required more than 30 second to return resources for ${kind}. (TotalElapsedTime: ${totalElapsedTime})`
    )
  } else if (totalElapsedTime > 1000) {
    console.warn(
      `Search required more than 1 second to return resources for ${kind}. (TotalElapsedTime: ${totalElapsedTime.toFixed(
        2
      )})`
    )
  }

  const searchResources = formatResourcesFromSearch(resp)
  console.log("Resources from search.", searchResources)
  return searchResources
}

// var searchApiRoute= ""
// var token = ""
describe('Search: API Resources', () => {
  beforeAll(async () => {
    // Log in and get access token
    token = getToken()

    // Create a route to access the Search API.
    searchApiRoute = await getSearchApiRoute()
    console.log("beforeAll - searchApiRoute: ", searchApiRoute)

    // Temporary workaround. TODO: Get SSL cert from cluster.
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
  })
 
  test("Should get route", async() => {
    searchApiRoute = await getSearchApiRoute()
    console.log("test - searchApiRoute: ", searchApiRoute)
  })


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

  var i =0
  // Run tests for each test cluster environment.
  clusterList.forEach((cluster) => {
    if (!cluster.skip) {
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
        if (i<2) {
          console.log(`testing resource ${resource.kind}.${group.name}`)
          test(`[P2][Sev2] verify data integrity for resource ${resource.kind}.${group.name}`,
            async () => ValidateSearchData(resource.kind, group, cluster),
            300000)
          i++
        } 
        // else {
        //   console.log(`skipping resource ${resource.kind}.${group.name}`)
        // }
      })
    } else {
      console.warn(
        `Detected skip option set to ${cluster.skip}. Proceeding to skip the API test for the ${cluster.type} cluster.`
      )
    }
  })
})
