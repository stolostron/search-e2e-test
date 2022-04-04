// Copyright (c) 2020 Red Hat, Inc.

const config = require('../../config')
const { sleep } = require('./sleep')
const { execSync } = require('child_process')
const request = require('supertest')
const fs = require('fs')

/**
 * Login into the cluster environment with the `oc` cli command.
 * @param {object} options Additional options for logging into the cluster environment.
 */
const clusterLogin = (options = { useInsecure: true }) => {
  var cmd = `oc login -u ${config.get('options:hub:user')} -p ${config.get(
    'options:hub:password'
  )} --server=https://api.${config.get('options:hub:baseDomain')}:6443`

  if (options.useInsecure) {
    cmd += ` --insecure-skip-tls-verify`
  }

  execSync(cmd)
}

/**
 * Delete a pod resourcec from a specified namespace within the cluster environment.
 * @param {*} pod The pod of the resource object.
 * @param {object} options Additional options for deleting the pod resource from the cluster environment.
 * @param {*} ns Teh namespace of the pod resource object.
 */
async function deletePod(pod, ns, options = {}) {
  execSync(`oc delete pod ${pod} -n ${ns} --wait=true`)
}

/**
 * Return a list of all kubeconfigs available for the given test environment.
 * @param {object} options Additional options for getting the kubeconfig files.
 * @returns {array} List of kubeconfig files that contain the cluster configurations for the test execution.
 */
const getKubeConfig = (options = {}) => {
  const kubeconfigs = []
  const dir = './kube/config'
  fs.readdirSync(dir).forEach((file) => {
    if (file[0] !== '.') {
      kubeconfigs.push(`${dir}/${file}`)
    }
  })
  return kubeconfigs
}

/**
 * Get the pods within a specified namespace using the `oc get pods` cli command.
 * @param {*} ns The namespace to get the pods from.
 * @param {object} options Additional options for getting the pod resources from the cluster environment.
 * @returns {array} A list of the pods within the specified namespace.
 */
function getPods(ns, options = {}) {
  var stdout = execSync(`oc get pods -n ${ns} --no-headers`).toString()
  const pods = stdout.split('\n').map((pod) => pod.split(/ +/))
  const filteredPods = pods.filter((item) => {
    return item[0] !== undefined
  })

  if (filteredPods[0] !== undefined) {
    return filteredPods
  }
}

/**
 * Return the endpoint route for the cluster environment Search API.
 * @param {object} options Additional options for getting the endpoint route of the Search API server.
 * @returns {string} The route of the cluster's Search API.
 */
const getSearchApiRoute = async (options = {}) => {
  const namespace = execSync(
    `oc get mch -A -o jsonpath='{.items[0].metadata.namespace}'`
  ).toString()
  const routes = execSync(`oc get routes -n ${namespace}`).toString()

  if (routes.indexOf('search-api-automation') == -1) {
    execSync(
      `oc create route passthrough search-api-automation --service=search-search-api --insecure-policy=Redirect -n ${namespace}`
    )
    await sleep(10000)
  }
  return `https://search-api-automation-${namespace}.apps.${config.get(
    'options:hub:baseDomain'
  )}`
}

/**
 * Get the current authorization token for the cluster environment.
 * @param {object} options Additional options for getting the cluster's authorization token.
 * @returns {string} The cluster environment authorization token.
 */
const getToken = (options = {}) => {
  return execSync('oc whoami -t').toString().replace('\n', '')
}

/**
 * Builds and returns a query object for a HTTP request. (Current supported input keys: `keywords`, `filters`, and `limit`)
 * @param {object} {} The input keys that will be used to build the query object.
 * @param {object} options Additional options for building the query object..
 * @returns {object} The query object.
 */
function searchQueryBuilder(
  { keywords = [], filters = [], limit = 1000 },
  options = {}
) {
  // Return query built from passed arguments.
  const query = {
    operationName: 'searchResult',
    variables: {
      input: [
        {
          keywords: keywords,
          filters: filters,
          limit: limit,
        },
      ],
    },
    query:
      'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n    __typename\n  }\n}\n',
  }
  return query
}

/**
 * Send a HTTP request to the API server and return the results. Expects the response to have a 200 status code.
 * @param {*} query The query to send.
 * @param {*} token The validation token to use for the request.
 * @param {object} options Additional options for sending the request.
 * @returns
 */
function sendRequest(query, token, options = {}) {
  return request(searchApiRoute)
    .post('/searchapi/graphql')
    .send(query)
    .set({ Authorization: `Bearer ${token}` })
    .expect(200)
}

exports.clusterLogin = clusterLogin
exports.deletePod = deletePod
exports.getKubeConfig = getKubeConfig
exports.getPods = getPods
exports.getSearchApiRoute = getSearchApiRoute
exports.getToken = getToken
exports.searchQueryBuilder = searchQueryBuilder
exports.sendRequest = sendRequest
