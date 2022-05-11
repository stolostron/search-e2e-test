// Copyright (c) 2020 Red Hat, Inc.

jest.retryTimes(global.retry)

const { execSync } = require('child_process')
const lodash = require('lodash')

const squad = require('../../config').get('squadName')
const {
  getKubeConfig,
  getSearchApiRoute,
  getToken,
  searchQueryBuilder,
  sendRequest,
} = require('../common-lib/clusterAccess')

// Set list to ignore resources that aren't being collected by Search.
const ignoreKindResourceList = ['event']

// Set list of resources that require filtering by api group.
const requireAPIGroup = []

/**
 * Format filters for search queries.
 * @param {*} kind The kind of resource to filter.
 * @param {*} group The API group to filter the resources against.
 * @param {*} namespace The namespace to filter the resources against.
 * @param {*} cluster The cluster to filter the resources against.
 * @returns `filter` Formatted array of object filters.
 */
function formatFilters(kind, group, namespace = '--all-namespaces', cluster = 'local-cluster') {
  const filter = []

  // Add namespace filter
  if (namespace !== '--all-namespaces')
    filter.push({ property: 'namespace', values: [namespace] })

  // Add kind filter
  filter.push({ property: 'kind', values: [kind] })

  // Add group filter
  if (group.useAPIGroup && group.name != 'v1')
    filter.push({ property: 'apigroup', values: [group.name] })

  // Add cluster filter
  filter.push({ property: 'cluster', values: [cluster.name] })

  return filter
}

/**
 * Fetches all namespaced resources that has methods list and watch.
 ** When fetching the api-resources, the data will be returned with the following format: [0]: NAME, [1]: SHORTNAMES, [2]: APIVERSIONS, [3]: NAMESPACED, [4]: KIND
 ** If there are no short names, the array will be returned with the following format: [0]: NAME, [1]: APIVERSIONS, [2]: NAMESPACED, [3]: KIND
 * @returns `resourceList` List of resource kinds that contains the following methods: (list, watch)
 */
function fetchAPIResourcesWithListWatchMethods() {
  const resourceList = []

  try {
    execSync(
      "oc api-resources --namespaced -o wide --sort-by=kind | grep -E 'list.*watch|watch.*list'"
    )
      .toLocaleString()
      .split('\n')
      .filter((resources) => resources)
      .forEach((res) => {
        var obj = { apigroup: '', kind: '' }

        // We need to start off with slicing the string before the methods are listed. (i.e [get, list, watch])
        // After the string is sliced, we need to split the string and filter out any empty data or whitespace.
        const item = res
          .slice(0, res.indexOf('['))
          .split(' ')
          .filter((data) => data)

        if (item) {
          obj.apigroup =
            item.length < 5 ? item[1].split('/')[0] : item[2].split('/')[0]
          obj.kind =
            item.length < 5 ? item[3].toLowerCase() : item[4].toLowerCase()

          resourceList.push(obj)
        }
      })
  } catch (e) {
    console.error(e)
  }

  return resourceList
}

/**
 * Base test for kubernetes
 * @param {*} kind
 * @param {*} apigroup
 * @param {*} cluster
 * @param {*} user
 * @param {*} namespace
 */
function baseTest(
  kind,
  apigroup = { name, useAPIGroup: false },
  cluster = { type: 'hub', name: 'local-cluster' },
  user = 'kubeadmin',
  namespace = '--all-namespaces'
) {
  var runTest = test
  var property = kind
  var res = []

  // Check to see if the test needs to include the apigroup name within the query. For kind resources with v1 versions, no apigroup is needed.
  if (apigroup.useAPIGroup && apigroup.name != 'v1')
    property += `.${apigroup.name}`

  var cmd = `oc get ${property.toLowerCase()} ${
    namespace === '--all-namespaces' ? namespace : `-n ${namespace}`
  } --no-headers `

  // We need to exclude managed cluster results from out request.
  if (cluster.type === 'hub' && process.env.OPTIONS_MANAGED_CLUSTER_NAME)
    cmd += `--field-selector='metadata.namespace!=${process.env.OPTIONS_MANAGED_CLUSTER_NAME}'`

  // Uncomment the following line for debugging purposes.
  // console.debug(cmd)

  try {
    res = removeEmptyEntries(
      execSync(cmd, { stdio: [] }).toLocaleString().split('\n')
    )
  } catch (err) {
    runTest = test.skip
  }

  runTest(
    `[P2][Sev2][${squad}] verify data integrity for resource property: ${!apigroup.useAPIGroup ? kind : `${kind}.${apigroup.name}`}`,
    async () => {
      const filters = formatFilters(kind, apigroup, namespace, cluster)

      // Fetch data from the search api.
      var query = searchQueryBuilder({ filters })

      console.time(`search: ${kind}`)
      var resp = await sendRequest(query, token)
      console.timeEnd(`search: ${kind}`)

      var searchResult = lodash
        .get(resp, 'body.data.searchResult[0].items')
        .filter((items) => items.namespace) // We're only interested in resources that have a namespace.
        .map((item) => ({
          cluster: item.cluster,
          kind: item.kind,
          name: item.name,
          namespace: item.namespace,
        }))

      expect(searchResult.length).toEqual(res.length)
    },
    20000
  )
}

function getTargetManagedCluster() {
  var targetCluster

  try {
    // Fetch imported clusters attached to the hub cluster.
    var managedClusters = execSync(
      'oc get managedclusters -o custom-columns=NAME:.metadata.name --no-headers'
    )
      .toString()
      .split('\n').filter((cluster) => cluster)

    console.info('Found the following clusters:', managedClusters)

    // Check to see if the managed cluster name exist wihin the environment.
    if (process.env.OPTIONS_MANAGED_CLUSTER_NAME) {
      console.info(
        `Checking for the exported managed cluster: ${process.env.OPTIONS_MANAGED_CLUSTER_NAME} within the returned list.`
      )

      if (
        managedClusters.find((c) =>
          c.includes(process.env.OPTIONS_MANAGED_CLUSTER_NAME)
        )
      ) {
        targetCluster = process.env.OPTIONS_MANAGED_CLUSTER_NAME
        return targetCluster
      }

      console.warn(
        `The targeted managed cluster: ${process.env.OPTIONS_MANAGED_CLUSTER_NAME} was not found in the list: ${managedClusters}`
      )
    }

    if (
      managedClusters.length === 1 &&
      managedClusters.find((c) => c.includes('local-cluster'))
    ) {
      console.info(
        `Managed cluster list only contains one managed cluster: ${managedClusters}. Proceeding to test only the local-cluster.`
      )
      return targetCluster
    } else {
      // In the canary tests, we only need to focus on the import-xxxx managed cluster.
      targetCluster = managedClusters.find(
        (c) =>
          c.startsWith('canary-') ||
          c.includes('canary') ||
          c.startsWith('import-')
      )
    }

    if (targetCluster === undefined) {
      targetCluster = managedClusters.find((c) => !c.includes('local-cluster'))
    }

    console.info(`Preparing to test with managed cluster: ${targetCluster}`)
    return targetCluster
  } catch (err) {
    console.warn(
      err,
      'Error getting managedclusters. Proceeding with the local cluster.'
    )
    return
  }
}

/**
 * Filter the array to contain only non-empty values.
 * @param {Array} array The array to filter the values from.
 * @returns `array` The filtered array.
 */
function removeEmptyEntries(array) {
  return array.filter((val) => val.replace(/\s+/g, ' '))
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

  // Generate list of clusters.
  const clusterList = [{ type: 'hub', name: 'local-cluster', skip: false }]

  // Get managed cluster.
  const managedCluster = getTargetManagedCluster()

  if (managedCluster) {
    // Set the managed cluster name within the environemnt.
    if (!process.env.OPTIONS_MANAGED_CLUSTER_NAME || (managedCluster != process.env.OPTIONS_MANAGED_CLUSTER_NAME))
      process.env.OPTIONS_MANAGED_CLUSTER_NAME = managedCluster

    clusterList.push({
      type: 'managed',
      name: managedCluster,
      skip: true,
    })
  }

  // Fetch API resources and filter out the kinds that aren't collected by search.
  var resourceList = fetchAPIResourcesWithListWatchMethods()
    .filter((resource) => !ignoreKindResourceList.includes(resource.kind))

  // Run tests for each test cluster environment.
  clusterList.forEach((cluster) => {
    if (!cluster.skip) {
      resourceList.forEach((resource) => {
        // There can multiple occurrences of the same resource kind with different API groups; therefore
        // if we detect multiple we will then test based upon API groups.
        var useAPIGroup = false
        const _ = resourceList.filter((res) => res.kind === resource.kind)

        if (_.length > 1 || requireAPIGroup.includes(resource.kind)) useAPIGroup = true

        baseTest(
          resource.kind,
          { name: resource.apigroup, useAPIGroup },
          cluster,
          'kubeadmin'
        )
      })
    } else {
      console.info(
        `Detected skip option set to ${cluster.skip}. Proceeding to skip the API test for the ${cluster.type} cluster.`
      )
    }
  })
})
