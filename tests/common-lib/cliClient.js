// Copyright Contributors to the Open Cluster Management project

const { execSync } = require('child_process')

/**
 * Execute a string of commands separated by \n.
 * The benefit of this function is that the string could be pasted into a terminal to recreate the test setup.
 * Lines starting with # are interrpreted as comments and ignored.
 * @param string commands to execute.
 */
async function execCliCmdString(commands) {
  const cmds = commands.split('\n')
  cmds.forEach((cmd) => {
    // Ignore empty lines and comments.
    if (cmd.trim() && cmd.trim().charAt(0) !== '#') {
      execSync(cmd.trim())
    }
  })
}

/**
 * Query the Kubernetes API using the oc CLI to get the expected state.
 * @param string kind
 * @param string apigroup
 * @param {[string]} namespace
 * @param {*} cluster
 * @returns {[]} Resources
 */
function getResourcesFromOC({
  user,
  kind,
  apigroup,
  namespace = '--all-namespaces',
  cluster = { type: 'hub', name: 'local-cluster' },
}) {
  if (!kind) {
    console.error('Error in test code, kind is required when calling getResourcesFromOC(). Received:', kind)
  }
  var property = kind

  // Check to see if the test needs to include the apigroup name within the query.
  // For kind resources with v1 versions, no apigroup is needed.
  if (apigroup && apigroup.useAPIGroup && apigroup.name != 'v1') property += `.${apigroup.name}`

  var cmd = `oc get ${property.toLowerCase()} ${
    namespace === '--all-namespaces' ? namespace : `-n ${namespace}`
  } --ignore-not-found=true`

  // Add kubeconfig filter if the option is set within the cluster object.
  if (cluster.kubeconfig) {
    cmd += ` --kubeconfig ${cluster.kubeconfig}`
  }

  // Impersonate the user.
  if (user && (user.fullName || user.name)) {
    cmd += ` --as=${user.fullName || user.name}`
  }

  try {
    return formatListOutput(
      cluster,
      kind,
      execSync(cmd, { stdio: [] })
        .toString()
        .split('\n')
        .filter((res) => res)
    )
  } catch (err) {
    if (err.message.indexOf("the server doesn't have a resource type") > 0) {
      // This is expected when a CRD gets removed by another test.
      return []
    } else if (err.message.indexOf('Error from server (Forbidden)') > 0) {
      // This is expected when user ddoesn't have access to a resource.
      return []
    }
    console.log(`Unexpected error getting resources from CLI. ${err.message}`)
    throw err
  }
}

/**
 * Format resources for search queries.
 * @param {Object} cluster The cluster of the resource objects.
 * @param {string} kind The kind of the resource objects.
 * @param {[string]} resources An array of strings that will be formated as an object containing name and namespace.
 * @returns `formatedResources` Formatted array of resource object.
 */
function formatListOutput(cluster, kind, resources) {
  let headers, nameIndex, namespaceIndex
  if (resources && resources.lenght > 1) {
    headers = resources.shift().split(' ').trim().toLowerCase()
    nameIndex = headers.indexOf('name')
    namespaceIndex = headers.indexOf('namespace')
  }
  const formattedResources = resources.map((res) => {
    const item = res.split(' ').filter((property) => property)
    return {
      cluster: cluster.name,
      kind,
      namespace: namespaceIndex >= 0 ? item[namespaceIndex] : undefined,
      name: item[nameIndex],
    }
  })

  return formattedResources
}

function expectCli(cmd) {
  return expect(() => execSync(cmd, { stdio: [] }))
}

exports.execCliCmdString = execCliCmdString
exports.expectCli = expectCli
exports.getResourcesFromOC = getResourcesFromOC
