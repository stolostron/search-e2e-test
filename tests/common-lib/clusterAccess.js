// Copyright Contributors to the Open Cluster Management project

const config = require('../../config')
const { sleep } = require('./sleep')
const { execSync } = require('child_process')
const fs = require('fs')

/**
 * Delete a kind resource from a specified namespace within the cluster environment.
 * @param {string} kind The kind of the resource object.
 * @param {string} name The name of the resource object.
 * @param {string} ns The namespace of the kind resource object.
 * @param {object} options Additional options for deleting the kind resource from the cluster environment.
 */
async function deleteResource(kind, name, ns, options = {}) {
  execSync(`oc delete ${kind} ${name} -n ${ns} --wait=true`)
}

/**
 * Return a list of all kubeconfigs available for the given test environment.
 * @returns {array} List of kubeconfig files that contain the cluster configurations for the test execution.
 */
function getKubeConfig() {
  const kubeconfigs = []
  const dir = './kube/config'

  try {
    fs.readdirSync(dir).forEach((file) => {
      if (file[0] !== '.') {
        kubeconfigs.push(`${dir}/${file}`)
      }
    })
  } catch (err) {
    console.log(`Unable to read kube config from environment. Reason: ${err}`)
  }

  return kubeconfigs
}

/**
 * Get the kind resource within a specified namespace using the `oc get <kind>` cli command.
 * @param {string} kind The kind of the resource object.
 * @param {string} ns The namespace of the kind resource object.
 * @param {object} options Additional options for getting the pod resources from the cluster environment.
 * @returns {array} A list of the kind resources within the specified namespace.
 */
function getResource(kind, ns, options = {}) {
  var stdout = execSync(`oc get ${kind} -n ${ns} --no-headers`).toString()
  const pods = stdout.split('\n').map((pod) => pod.split(/ +/))
  const filteredPods = pods.filter((item) => {
    return item[0] !== undefined
  })

  if (filteredPods[0] !== undefined) {
    return filteredPods
  }
}

/**
 * Create and return the route to access the Search API in the target cluster.
 * @returns {string} The route to the Search API.
 */
async function getSearchApiRoute() {
  const namespace = execSync(`oc get mch -A -o jsonpath='{.items[0].metadata.namespace}'`).toString()
  let route
  try {
    route = execSync(`oc get route search-api-automation -n ${namespace} -o jsonpath='{.spec.host}'`, {
      stdio: [],
    }).toString()
  } catch (e) {
    execSync(
      `oc create route passthrough search-api-automation --service=search-search-api --insecure-policy=Redirect -n ${namespace}`
    )
    console.log('\nCreated route search-api-automation.')
    route = execSync(`oc get route search-api-automation -n ${namespace} -o jsonpath='{.spec.host}'`)
  }
  return `https://${route}`
}

/**
 * Get the current authorization token for the target cluster environment.
 * @returns {string} The cluster environment authorization token.
 */
function getKubeadminToken() {
  return execSync('oc whoami -t').toString().replace('\n', '')
}

/**
 * Gets the token and other information required to impersonate a user (service account).
 * @param string username - Service account name.
 * @param string namespace - Namespace of the service account.
 * @returns {name, namespace, fullName, token} - Object with information to impersonate user.
 */
async function getUserContext({ usr, ns }) {
  let t
  try {
    t = execSync(`oc create token ${usr} -n ${ns}`)
  } catch (e) {
    const ocVersion = execSync(`oc version`).toString()
    console.warn(`Failed to create token for service account. This test requires oc version 4.11.0 or later.
    The oc version in the current environment is:
    ${ocVersion}
    Original error: ${e}
    Falling back to using deprecated command 'oc serviceaccounts get-token ${usr} -n ${ns}`)

    t = execSync(`oc serviceaccounts get-token ${usr} -n ${ns}`)
  }
  return {
    fullName: `system:serviceaccount:${ns}:${usr}`,
    name: usr,
    namespace: ns,
    token: t,
  }
}

exports.deleteResource = deleteResource
exports.getKubeConfig = getKubeConfig
exports.getUserContext = getUserContext
exports.getResource = getResource
exports.getSearchApiRoute = getSearchApiRoute
exports.getKubeadminToken = getKubeadminToken
