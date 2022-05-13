// Copyright (c) 2020 Red Hat, Inc.

jest.retryTimes(global.retry)

const { fail } = require('assert');
const { performance } = require('perf_hooks');

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
  getResourcesFromOC,
  getClusterList,
  shouldUseAPIGroup
} = require('../common-lib/index')

const { sleep } = require('../common-lib/sleep')

// Set list to ignore resources that aren't being collected by Search.
const ignoreKindResourceList = ['clusterclaim', 'event']

// Set list of resources that require filtering by api group.
const requireAPIGroup = []

/**
 * Base test for kubernetes
 * @param {*} kind
 * @param {*} apigroup
 * @param {*} cluster
 * @param {*} user
 * @param {*} namespace
 */
function baseTest(kind, apigroup, cluster = { type: 'hub', name: 'local-cluster' }, user = 'kubeadmin', namespace = '--all-namespaces') {
  var runTest = test

  try {
    var expectedResources = getResourcesFromOC(kind, apigroup, namespace, cluster)
  } catch (err) {
    runTest = test.skip
  }

  runTest(
    `[P2][Sev2][${squad}] verify data integrity for resource property: ${!apigroup.useAPIGroup ? kind : `${kind}.${apigroup.name}`}`,
    async () => {
      const filters = formatFilters(kind, apigroup, namespace, cluster)

      // Fetch data from the search api.
      var query = searchQueryBuilder({ filters })

      var startTime = performance.now()
      var resp = await sendRequest(query, token)
      var endTime = performance.now()
      var totalElapsedTime = endTime - startTime

      var searchResources = formatResourcesFromSearch(resp)
      
      if (totalElapsedTime > 30000) {
        fail(`Search required more than 30 second to return resources for ${kind}. (TotalElapsedTime: ${totalElapsedTime})`)
      } else if (totalElapsedTime > 1000) {
        console.warn(`Search required more than 1 second to return resources for ${kind}. (TotalElapsedTime: ${totalElapsedTime})`)
      }

      if (searchResources.length != expectedResources.length) {
        console.warn(`Detected incorrect amount of data matches for (${kind}) resources. Retrying test within 5 seconds.`)
        await sleep(5000)

        // Refresh the list of resources. There's a chance that more resources were created after the previous fetch.
        expectedResources = getResourcesFromOC(kind, apigroup, namespace, cluster)
        resp = await sendRequest(query, token)
        
        searchResources = formatResourcesFromSearch(resp)
        console.info(`Fetched total expected resources: ${expectedResources.length}, total search resources: ${searchResources.length}`)

        const mismatchResources = searchResources.filter((res) => !expectedResources.find((obj) => obj.name === res.name))
        console.log('mismatch', mismatchResources)
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

  // Set the default user for testing.
  var user = process.env.OPTIONS_HUB_USER || 'kubeadmin'

  // Generate list of clusters.
  const clusterList = getClusterList()

  // Fetch API resources and filter out the kinds that aren't collected by search.
  console.info("Ignoring resources that aren't collected by Search:", ignoreKindResourceList)
  const resourceList = fetchAPIResourcesWithListWatchMethods()
    .filter((resource) => !ignoreKindResourceList.includes(resource.kind))

  // Run tests for each test cluster environment.
  clusterList.forEach((cluster) => {
    if (!cluster.skip) {
      resourceList.forEach((resource) => {
        // There can be multiple occurrences of the same resource kind with different API groups; therefore
        // if we detect multiple versions of the same resource we will then test based upon API groups.
        var group = { name: resource.apigroup, useAPIGroup: shouldUseAPIGroup(resource.kind, resourceList, requireAPIGroup) }
        baseTest(resource.kind, group, cluster, user)
      })
    } else {
      console.info(
        `Detected skip option set to ${cluster.skip}. Proceeding to skip the API test for the ${cluster.type} cluster.`
      )
    }
  })
})
