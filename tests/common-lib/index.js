// Copyright Contributors to the Open Cluster Management project

const { execSync } = require('child_process')

/**
 * Format resources for search queries.
 * @param {Object} cluster The cluster of the resource objects.
 * @param {string} kind The kind of the resource objects.
 * @param {*} resources A list of resources that will be formated as an object containing name and namespace.
 * @returns `formatedResources` Formatted array of resource object.
 */
function formatResources(cluster, kind, resources) {
  var formattedResources = resources.map((res) => {
    const item = res.split(' ').filter((property) => property)
    return {
      cluster: cluster.name,
      kind,
      namespace: item[0],
      name: item[1],
    }
  })

  return formattedResources
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
    execSync("oc api-resources --namespaced -o wide --sort-by=kind | grep -E 'list.*watch|watch.*list'")
      .toString()
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
          obj.kind = item[item.length - 1].toLowerCase() // Kind is the last item.
          obj.apigroup = item.length < 5 ? item[1].split('/')[0] : item[2].split('/')[0]

          resourceList.push(obj)
        }
      })
  } catch (e) {
    console.error(e)
  }

  return resourceList
}

/**
 * Generates and returns a list of cluster environments.
 * @param {Array} kubeconfigs List of kubeconfig files.
 * @returns clusters List of clusters environemnt.
 */
function getClusterList(kubeconfigs = []) {
  const clusters = [
    {
      name: 'local-cluster',
      skip: false,
      type: 'hub',
    },
  ]

  // Get managed cluster.
  const managedCluster = getTargetManagedCluster()

  if (managedCluster) {
    // Set the managed cluster name within the environemnt.
    if (!process.env.OPTIONS_MANAGED_CLUSTER_NAME || managedCluster != process.env.OPTIONS_MANAGED_CLUSTER_NAME)
      process.env.OPTIONS_MANAGED_CLUSTER_NAME = managedCluster

    // TODO: Implement a better method to consume less resources for the managed cluster test.
    // The managed cluster will not contain the same api resources at the hub cluster, so we need to improve this behavior.
    // Skipping the managed cluster test until a future PR is implemented.
    clusters.push({
      kubeconfig: kubeconfigs.find((conf) => conf.includes('import')),
      name: managedCluster,
      skip: true,
      type: 'managed',
    })
  }

  return clusters
}

/**
 * Query the Kubernetes API using the oc CLI to get the expected state.
 * @param string kind
 * @param string apigroup
 * @param {[string]} namespace
 * @param {*} cluster
 * @returns {[]} Resources
 */
function getResourcesFromOC(
  kind,
  apigroup,
  namespace = '--all-namespaces',
  cluster = { type: 'hub', name: 'local-cluster' }
) {
  var property = kind

  // Check to see if the test needs to include the apigroup name within the query. For kind resources with v1 versions, no apigroup is needed.
  if (apigroup.useAPIGroup && apigroup.name != 'v1') property += `.${apigroup.name}`

  var cmd = `oc get ${property.toLowerCase()} ${
    namespace === '--all-namespaces' ? namespace : `-n ${namespace}`
  } --no-headers --ignore-not-found=true`

  // Add kubeconfig filter if the option is set within the cluster object.
  if (cluster.kubeconfig) {
    cmd += `--kubeconfig ${cluster.kubeconfig}`
  }

  try {
    return formatResources(
      cluster,
      kind,
      execSync(cmd, { stdio: [] })
        .toString()
        .split('\n')
        .filter((res) => res)
    )
  } catch (err) {
    if (err.message.indexOf("the server doesn't have a resource type") > 0) {
      console.log(
        `The resource [${kind}.${apigroup}] doesn't exists in the cluster. It's possible that the CRD was removed by another test. Returning [] instead of the error.`
      )
      return []
    }
    throw e
  }
}

/**
 * Return an imported cluster attached to the current hub cluster environment.
 * @returns `targetCluster` The imported cluster.
 */
function getTargetManagedCluster() {
  var targetCluster

  try {
    // Fetch imported clusters attached to the hub cluster.
    var managedClusters = execSync('oc get managedclusters -o custom-columns=NAME:.metadata.name --no-headers')
      .toString()
      .split('\n')
      .filter((cluster) => cluster)

    console.info('Found the following clusters:', managedClusters)

    // Check to see if the managed cluster name exist wihin the environment.
    if (process.env.OPTIONS_MANAGED_CLUSTER_NAME) {
      console.info(
        `Checking for the exported managed cluster: ${process.env.OPTIONS_MANAGED_CLUSTER_NAME} within the returned list.`
      )

      if (managedClusters.find((c) => c.includes(process.env.OPTIONS_MANAGED_CLUSTER_NAME))) {
        targetCluster = process.env.OPTIONS_MANAGED_CLUSTER_NAME
        return targetCluster
      }

      console.warn(
        `The targeted managed cluster: ${process.env.OPTIONS_MANAGED_CLUSTER_NAME} was not found in the list: ${managedClusters}`
      )
    }

    if (managedClusters.length === 1 && managedClusters.find((c) => c.includes('local-cluster'))) {
      console.info(
        `Managed cluster list only contains one managed cluster: ${managedClusters}. Proceeding to test only the local-cluster.`
      )
      return targetCluster
    } else {
      // In the canary tests, we only need to focus on the import-xxxx managed cluster.
      targetCluster = managedClusters.find(
        (c) => c.startsWith('canary-') || c.includes('canary') || c.startsWith('import-')
      )
    }

    if (targetCluster === undefined) {
      targetCluster = managedClusters.find((c) => !c.includes('local-cluster'))
    }

    console.info(`Preparing to test with managed cluster: ${targetCluster}`)
    return targetCluster
  } catch (err) {
    console.warn(err, 'Error getting managedclusters. Proceeding with the local cluster.')
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

/**
 * Determines whether the api resource is required to use the specified api group for its kind.
 * @param {string} kind The api resource kind.
 * @param {Array} resourceList List of api resources.
 * @param {Array} requiredList List of api resources that are required to use their respective api group.
 * @returns `bool` The status of whether the api resource is required for usage.
 */
function shouldUseAPIGroup(kind, resourceList, requiredList = []) {
  const _ = resourceList.filter((res) => res.kind === kind)
  return _.length > 1 || requiredList.includes(kind)
}

exports.fetchAPIResourcesWithListWatchMethods = fetchAPIResourcesWithListWatchMethods
exports.formatResources = formatResources
exports.getClusterList = getClusterList
exports.getResourcesFromOC = getResourcesFromOC
exports.getTargetManagedCluster = getTargetManagedCluster
exports.removeEmptyEntries = removeEmptyEntries
exports.shouldUseAPIGroup = shouldUseAPIGroup
