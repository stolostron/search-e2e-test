// Copyright Contributors to the Open Cluster Management project

jest.retryTimes(global.retry)

const { fail } = require('assert')
const { performance } = require('perf_hooks')

const squad = require('../../config').get('squadName')
const {
  getKubeConfig,
  getSearchApiRoute,
  getToken,
  searchQueryBuilder,
  sendRequest,
} = require('../common-lib/clusterAccess')

const {
  fetchAPIResourcesWithListWatchMethods,
  formatResourcesFromSearch,
  formatFilters,
  getMismatchedResources,
  getResourcesFromOC,
  getClusterList,
  shouldUseAPIGroup,
  verifyMissingResourcesFound,
} = require('../common-lib/index')

const { sleep } = require('../common-lib/sleep')

// Set list to ignore resources that aren't being collected by Search.
const ignoreKindResourceList = ['clusterclaim', 'event']

// Set list of resources that require filtering by api group.
const requireAPIGroup = []

/**
 * Base test for kubernetes
 * @param {*} kind The resource object kind that will be used for testing.
 * @param {*} apigroup The apigroup of the object kind.
 * @param {*} cluster The cluster of the object kind.
 * @param {*} user The user that will be used to test the resource.
 * @param {*} namespace The namespace of the object kind.
 */
function baseTest(
  kind,
  apigroup,
  cluster = { type: 'hub', name: 'local-cluster' },
  user = 'kubeadmin',
  namespace = '--all-namespaces'
) {
  var runTest = test
  var expectedResources = []

  try {
    expectedResources = getResourcesFromOC(kind, apigroup, namespace, cluster)
  } catch (err) {
    console.error(
      `Skipping test because there was an error getting the expected resources from OC command. kind=${kind} apigroup=${apigroup.name} namespace=${namespace} cluster=${cluster.name} Error: ${err}`
    )
    runTest = test.skip
  }

  runTest(
    `[P2][Sev2][${squad}] verify data integrity for resource property: ${
      !apigroup.useAPIGroup ? kind : `${kind}.${apigroup.name}`
    }`,
    async () => {
      const filters = formatFilters(kind, apigroup, namespace, cluster)
      var mismatchResources = []

      // Fetch data from the search api.
      var query = searchQueryBuilder({ filters })

      // Monitor how long search took to return results.
      var startTime = performance.now()
      var resp = await sendRequest(query, token)
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

      var searchResources = formatResourcesFromSearch(resp)

      // Verify if the resources returned for both APIs are correct.
      if (searchResources.length != expectedResources.length) {
        console.warn(
          `Detected incorrect amount of data matches for (${kind}) resources (search/expected) - (${searchResources.length}/${expectedResources.length}). Retrying test within 5 seconds.`
        )

        // Check to see which API returned more resources than the other.
        mismatchResources = getMismatchedResources(searchResources, expectedResources)
        console.info('mismatchResources', mismatchResources)
        await sleep(5000)

        // Refresh the list of resources. There's a chance that more resources were created after the previous fetch.
        expectedResources,
          (resp = Promise.all(
            getResourcesFromOC(kind, apigroup, namespace, cluster),
            sendRequest(query, token)
          ))

        console.info(
          `Fetched total resources on retry: (${searchResources.length}/${expectedResources.length}), verifying if resources are available or removed from APIs.`
        )
        verifyMissingResourcesFound(mismatchResources, resp, expectedResources)
      }

      expect(searchResources.length).toEqual(expectedResources.length)
    },
    20000
  )
}

describe('Search: API Resources', () => {
  beforeAll(async () => {
    // Log in and get access token
    token = getToken()

    // Create a route to access the Search API.
    searchApiRoute = await getSearchApiRoute()

    // Temporary workaround. TODO: Get SSL cert from cluster.
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
  })

  // Get kubeconfig for imported clusters
  var kubeconfigs = getKubeConfig()

  // Set the default user for testing.
  var user = process.env.OPTIONS_HUB_USER || 'kubeadmin'

  // Generate list of clusters.
  const clusterList = getClusterList()

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
        baseTest(resource.kind, group, cluster, user)
      })
    } else {
      console.warn(
        `Detected skip option set to ${cluster.skip}. Proceeding to skip the API test for the ${cluster.type} cluster.`
      )
    }
  })
})
