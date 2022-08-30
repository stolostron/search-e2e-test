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
    route = execSync(`oc get route search-api-automation -n ${namespace} -o jsonpath='{.spec.host}'`)
  } catch (e) {
    execSync(
      `oc create route passthrough search-api-automation --service=search-search-api --insecure-policy=Redirect -n ${namespace}`
    )
    await sleep(5000)
    console.log('Created route search-api-automation.')
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
 * @param string username - Service account name.
 * @param string namespace - Namespace of the service account.
 * @param number retryWait - Milliseconds to wait before retry. Default: 9000 ms
 * @returns {name, namespace, fullName, token} - Object with information to impersonate user.
 */
async function getUserContext({ usr, ns, retryWait = 9000 }) {
  let t
  try {
    t = execSync(`oc serviceaccounts get-token ${usr} -n ${ns}`)
  } catch (e) {
    console.warn(`Failed to get service account token, will retry after ${retryWait} ms.`, e)
    let sa = execSync(`oc get serviceaccount ${usr} -n ${ns} -o yaml`).toString()
    console.log('Service account yaml after error: ', sa) // Used to debug canary environment.
    let podState = execSync(`oc get pod -A`).toString()
    console.log(`Pods after error.`, podState) // Used to debug canary environment.
    await sleep(retryWait)
    sa = execSync(`oc get serviceaccount ${usr} -n ${ns} -o yaml`).toString()
    console.log('Service account yaml after wait: ', sa) // Used to debug canary environment.
    podState = execSync(`oc get pod -A`).toString()
    console.log(`Pods after waiting.`, podState) // Used to debug canary environment.
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
