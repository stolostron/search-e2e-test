// Copyright (c) 2020 Red Hat, Inc.

jest.retryTimes(global.retry)

const { exec, execSync } = require('child_process')
const lodash = require('lodash')

const squad = require('../../config').get('squadName')
const {
  getKubeConfig,
  getSearchApiRoute,
  getToken,
  searchQueryBuilder,
  sendRequest,
} = require('../common-lib/clusterAccess')

// Generate list of resources to be tested.
const testList = ['configmap', 'deployment', 'pod', 'secret']

// Error
const REQUESTED_RESOURCE_NOT_FOUND_ERROR =
  'server could not find the requested resource'

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
  console.debug(cmd)

  try {
    res = removeEmptyEntries(
      execSync(cmd, { stdio: [] }).toLocaleString().split('\n')
    )
  } catch (err) {
    runTest = test.skip
  }

  runTest(`[P2][Sev2][${squad}] verify data integrity for resource property: ${
    apigroup.useAPIGroup ? kind : `${kind}.${apigroup.name}`
  }`, async () => {
    const filters = [
      { property: 'cluster', values: [cluster.name] },
      { property: 'kind', values: [kind] },
    ]

    if (namespace !== '--all-namespaces')
      filters.push({ property: 'namespace', values: [namespace] })

    if (apigroup.useAPIGroup && apigroup.name != 'v1')
      filters.push({ property: 'apigroup', values: [apigroup.name] })

    console.log(filters)

    // Fetch data from the search api.
    var query = searchQueryBuilder({ filters })
    var resp = await sendRequest(query, token)

    var searchResult = lodash.get(resp, 'body.data.searchResult[0].items')
      .filter((items) => items.namespace)
      .map((item) => ({ cluster: item.cluster, kind: item.kind, name: item.name, namespace: item.namespace }))

    console.log(searchResult)
    expect(searchResult.length).toEqual(res.length)
  }, 20000)
}

function getTargetManagedCluster() {
  var targetCluster

  try {
    // Fetch imported clusters attached to the hub cluster.
    var managedClusters = removeEmptyEntries(
      execSync(
        'oc get managedclusters -o custom-columns=NAME:.metadata.name --no-headers'
      )
        .toString()
        .split('\n')
    )

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
        process.env.USE_OPTIONS_MANAGED_CLUSTER_NAME = true

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

// DONE
/**
 * Fetches all namespaced resources.
 * When fetching the api-resources, the data will be returned with the following format: [0]: NAME, [1]: SHORTNAMES, [2]: APIVERSIONS, [3]: NAMESPACED, [4]: KIND
 * If there are no short names, the array will be returned with the following format: [0]: NAME, [1]: APIVERSIONS, [2]: NAMESPACED, [3]: KIND
 * @param {Array} resources
 * @returns
 */
function fetchAllAPIResources(
  user,
  cluster = { type: 'hub', name: 'local-cluster' }
) {
  var resourceList = []
  var cmd = `oc api-resources --no-headers --namespaced --sort-by=name`

  if (cluster.type !== 'hub') {
    console.log(
      `Using managed cluster kubeconfig located at: ${process.env.OPTIONS_MANAGED_KUBECONFIG}`
    )
    cmd += `--kubeconfig=${process.env.OPTIONS_MANAGED_KUBECONFIG}`
  }

  try {
    const resources = execSync(cmd).toLocaleString().split('\n')
    resources.forEach((res) => {
      var obj = { apigroup: '', kind: '' }

      // Remove extra spaces from the string and split the string into smaller consumable parts.
      const item = res.replace(/\s+/g, ' ').split(' ')

      // Set the apigroup and kind properties of the resource object.
      if (lodash.get(item, '[0]')) {
        obj.apigroup =
          item.length < 5 ? item[1].split('/')[0] : item[2].split('/')[0]
        obj.kind =
          item.length < 5 ? item[3].toLowerCase() : item[4].toLowerCase()

        resourceList.push(obj)
      }
    })
  } catch (err) {
    console.error(
      `Failed to fetch api resources from the cluster: ${cluster} with user ${user}`
    )
  }
  return resourceList
}

// DONE
describe('Search: api resources', () => {
  beforeAll(async () => {
    // Log in and get access token
    token = getToken()

    // Create a route to access the Search API.
    searchApiRoute = await getSearchApiRoute()

    // Temporary workaround. TODO: Get SSL cert from cluster.
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
  })

  // Get managed cluster.
  const managedCluster = getTargetManagedCluster()

  if (managedCluster && !process.env.OPTIONS_MANAGED_CLUSTER_NAME) {
    console.info(`Setting OPTIONS_MANAGED_CLUSTER_NAME to: ${managedCluster}`)
    process.env.OPTIONS_MANAGED_CLUSTER_NAME = managedCluster
  }

  // Generate list of cluster to be tested.
  const clusterList = [{ type: 'hub', name: 'local-cluster', skip: false }]
  clusterList.push({ type: 'managed', name: managedCluster, skip: true })

  clusterList.forEach((cluster) => {
    if (!cluster.skip) {
      var resourceList = fetchAllAPIResources('kubeamdin', cluster)

      resourceList.forEach((resource) => {
        // There can multiple occurrences of the same resource kind with different API groups; therefore
        // if we detect multiple we will then test based upon API groups.
        const _ = resourceList.filter((res) => res.kind === resource.kind)
        var useAPIGroup = false

        if (_.length > 1) useAPIGroup = true

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
