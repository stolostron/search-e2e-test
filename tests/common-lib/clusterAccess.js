// Copyright Contributors to the Open Cluster Management project

// const config = require('../../config')
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

/**
 * Get the local cluster name for the target cluster environment.
 * @returns {string} The local cluster name.
 */
let localClusterName
function getLocalClusterName() {
  if (localClusterName) {
    return localClusterName
  }
  localClusterName = execSync("oc get managedcluster -l local-cluster -o jsonpath='{.items[0].metadata.name}'")
    .toString()
    .trim()
  if (!localClusterName) throw new Error('Unable to resolve the local cluster name')
  return localClusterName
}

/**
 * Return the route to access the Thanos querier API in the target cluster.
 * @returns {string} The route to the Thanos querier API.
 */
let thanosRoute
async function getThanosQuerierRoute() {
  if (thanosRoute) {
    return `https://${thanosRoute}`
  }
  thanosRoute = execSync(`oc get route thanos-querier -n openshift-monitoring -o jsonpath='{.spec.host}'`, {
    stdio: [],
  }).toString()
  return `https://${thanosRoute}`
}

/**
 * Resolve the ACM namespace from env or the MultiClusterHub resource.
 * Falls back to 'open-cluster-management' if MCH is not found.
 * @returns {string} The ACM namespace.
 */
function resolveAcmNamespace() {
  if (process.env.ACM_NAMESPACE) {
    return process.env.ACM_NAMESPACE
  }
  if (process.env.CYPRESS_ACM_NAMESPACE) {
    return process.env.CYPRESS_ACM_NAMESPACE
  }
  try {
    return (
      execSync("oc get mch -A -o jsonpath='{.items[0].metadata.namespace}'", {
        stdio: ['pipe', 'pipe', 'ignore'],
      })
        .toString()
        .trim() || 'open-cluster-management'
    )
  } catch (_) {
    return 'open-cluster-management'
  }
}

/**
 * Retrieve the OpenShift service CA certificate so callers can verify TLS
 * connections to services that use `service.beta.openshift.io/serving-cert-secret-name`.
 *
 * The service-ca controller injects the CA bundle into every namespace as
 * `configmap/openshift-service-ca.crt`, key `service-ca.crt`.
 *
 * Tries the ACM namespace first (the most reliable source since the Search API
 * runs there), then falls back to `default`. Returns `undefined` when neither
 * is readable so the caller can fall back gracefully.
 *
 * @returns {Buffer|undefined} PEM-encoded CA certificate, or undefined.
 */
function getServiceCA() {
  const acmNamespace = resolveAcmNamespace()
  for (const ns of [acmNamespace, 'default']) {
    try {
      const pem = execSync(
        `oc get configmap openshift-service-ca.crt -n ${ns} -o jsonpath='{.data.service-ca\\.crt}'`,
        { stdio: ['pipe', 'pipe', 'ignore'] }
      )
        .toString()
        .trim()
      if (pem) {
        // The value is already PEM — return as Buffer.
        return Buffer.from(pem)
      }
    } catch (_) {
      // Try next namespace.
    }
  }
  console.warn('[clusterAccess] Could not retrieve service CA; TLS verification may be incomplete.')
  return undefined
}

/**
 * Retrieve the OpenShift router CA certificate so callers can verify TLS
 * connections that use the public route hostname (e.g. *.apps.<cluster>).
 *
 * The Search API route (`search-api-automation`) is a TLS passthrough route,
 * meaning the router does not terminate TLS — the backend service certificate
 * is presented directly to the client. However, that service certificate is
 * signed by the OpenShift service CA, and the route hostname (*.apps.*) is
 * covered by the router's wildcard certificate which is signed by the ingress
 * operator CA stored in `openshift-ingress-operator/router-ca`.
 *
 * NOTE: for a TLS *passthrough* route the certificate presented is the backend
 * service cert, not the router cert. Use this CA only when the WebSocket
 * connects to the *route hostname* and the route is passthrough — in that case
 * you need the CA that signed the *service* cert (i.e. the service CA), or you
 * must suppress hostname verification. If the route is re-encrypted or edge,
 * use this router CA instead.
 *
 * The router CA PEM is stored in the `router-ca` secret in the
 * `openshift-ingress-operator` namespace, key `tls.crt`.
 *
 * @returns {Buffer|undefined} PEM-encoded router CA certificate, or undefined.
 */
function getRouterCA() {
  try {
    const pem = execSync(`oc get secret router-ca -n openshift-ingress-operator -o jsonpath='{.data.tls\\.crt}'`, {
      stdio: ['pipe', 'pipe', 'ignore'],
    })
      .toString()
      .trim()
    if (!pem) {
      console.warn('[clusterAccess] router-ca secret was empty; TLS verification may be incomplete.')
      return undefined
    }
    const decoded = Buffer.from(pem, 'base64').toString('utf8')
    if (!decoded.includes('-----BEGIN CERTIFICATE-----')) {
      console.warn('[clusterAccess] router-ca did not contain a valid PEM certificate.')
      return undefined
    }
    return Buffer.from(decoded)
  } catch (err) {
    console.warn(`[clusterAccess] Could not retrieve router CA: ${err.message}`)
    return undefined
  }
}

exports.deleteResource = deleteResource
exports.getRouterCA = getRouterCA
exports.getServiceCA = getServiceCA
exports.getKubeConfig = getKubeConfig
exports.getUserContext = getUserContext
exports.getResource = getResource
exports.getSearchApiRoute = getSearchApiRoute
exports.getKubeadminToken = getKubeadminToken
exports.getLocalClusterName = getLocalClusterName
exports.getThanosQuerierRoute = getThanosQuerierRoute
exports.resolveAcmNamespace = resolveAcmNamespace
