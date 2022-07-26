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
  closeMatch,
  fetchAPIResourcesWithListWatchMethods,
  formatResourcesFromSearch,
  formatFilters,
  getMismatchResources,
  getResourcesFromOC,
  getClusterList,
  matchPerc,
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
 * Base test for kubernetes
 * @param {*} kind The resource object kind that will be used for testing.
 * @param {*} apigroup The apigroup of the object kind.
 * @param {*} cluster The cluster of the object kind.
 * @param {*} namespace The namespace of the object kind.
 */
function baseTest(
  kind,
  apigroup,
  cluster = { type: 'hub', name: 'local-cluster' },
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
          `Detected incorrect amount of data matches for (${kind}) resources (search/expected) - (${searchResources.length}/${expectedResources.length}).`
        )

        const match = matchPerc(searchResources, expectedResources)
        console.log(`(${kind}) - Match Percentage (${match})`)

        const mismatch = getMismatchResources(
          searchResources,
          expectedResources
        )

        // Log the mismatched resources.
        if (mismatch.length !== 0) {
          console.warn('Mismatched resources found:', mismatch)
        }

        // If the match percentage is below 100%, we will verify if the amount of resources returned are contained within a targeted range (default: 3)
        if (parseFloat(match) < 100.0) {
          if (closeMatch(searchResources, expectedResources)) {
            expect(closeMatch(searchResources, expectedResources)).toBeTruthy()
          }
        } else {
          expect(parseFloat(match)).toBeGreaterThanOrEqual(100.0)
        }
      } else {
        expect(searchResources.length).toEqual(expectedResources.length)
      }
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
        baseTest(resource.kind, group, cluster)
      })
    } else {
      console.warn(
        `Detected skip option set to ${cluster.skip}. Proceeding to skip the API test for the ${cluster.type} cluster.`
      )
    }
  })
})
