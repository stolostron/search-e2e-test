// Copyright Contributors to the Open Cluster Management project

/*
 * This file has functions to interact with the Search API.
 */
const { fail } = require('assert')
const request = require('supertest')
const lodash = require('lodash')
const console = require('console') // Overrides jest console logger with default.

/**
 * Query the Search API using the given filters.
 *
 * @param {string} kind The kind filter
 * @param {strinig} apigroup The apigroup filter
 * @param {*} cluster The cluster fiilter.
 * @param {string} namespace The namespace filter.
 */
async function getResourcesFromSearch({
  token,
  kind,
  apigroup,
  namespace = '--all-namespaces',
  cluster = { type: 'hub', name: 'local-cluster' },
}) {
  // Build the search api query.
  const filters = formatFilters(kind, apigroup, namespace, cluster)
  const query = searchQueryBuilder({ filters })
  // Fetch data from the search api.
  const resp = await sendRequest(query, token)

  return lodash.get(resp, 'body.data.searchResult[0].items', [])
}

/**
 * Builds and returns a graphQl query requesting items.
 * Current supported input keys: `keywords`, `filters`, and `limit`
 * @param {keywords:[], filters:[], limit:number } input The input parameters that will be used to build the query object.
 * @returns {object} The graphQl query object.
 */
function searchQueryBuilder({ keywords = [], filters = [], limit = 10000 }) {
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
 * Builds and returns a graphQl query requesting count.
 * @param {keywords:[], filters:[], limit:number } input The input parameters that will be used to build the query object.
 * @returns {object} The graphQl query object.
 */
function searchCountQuery({ keywords = [], filters = [], limit = 10000 }) {
  // Return query built from passed arguments.
  const query = {
    operationName: 'searchCount',
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
      'query searchCount($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    count\n    __typename\n  }\n}\n',
  }
  return query
}

/**
 * Collect metrics from the search requests to evaluate performace.
 * @object { time, token, firstRequest }
 */
const metrics = []

/**
 * Send a HTTP request to the API server and return the results. Expects the response to have a 200 status code.
 * @param {*} query The query to send.
 * @param {string} token The validation token to use for the request.
 * @param {object} options Additional options for sending the request.
 * @returns
 */
function sendRequest(query, token, options = {}) {
  // Disable SSL validation so we can connect to the search-api route.
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0

  // Monitor how long search takes to return results.
  const startTime = Date.now()

  return request(searchApiRoute)
    .post('/searchapi/graphql')
    .send(query)
    .set({ Authorization: `Bearer ${token}` })
    .expect(200)
    .then((r) => {
      const elapsed = Date.now() - startTime
      const isFirstRequest = !metrics.map((m) => m.token).includes(token)

      if (elapsed > 4900) {
        fail(`Search-api request took more than 5 seconds. (ElapsedTime: ${elapsed.toFixed(2)} ms, isFirstRequest: ${isFirstRequest})
    operation: ${query.operationName}\t variables: ${JSON.stringify(query.variables)}`)
      } else if (elapsed > 1000) {
        console.log(`Slow search-api request. (ElapsedTime: ${elapsed.toFixed(2)} ms, isFirstRequest: ${isFirstRequest})
    operation: ${query.operationName}\t variables: ${JSON.stringify(query.variables)}`)
      }

      metrics.push({ time: elapsed, token, firstRequest: !metrics.map((m) => m.token).includes(token) })
      return r
    })
}

/**
 * Format filters for search queries.
 * @param {string} kind The kind of resource to filter.
 * @param {Object} group The API group to filter the resources against.
 * @param {string} namespace The namespace to filter the resources against.
 * @param {Object} cluster The cluster to filter the resources against.
 * @returns {[filter]} Formatted array of object filters.
 */
function formatFilters(kind, group, namespace = '--all-namespaces', cluster = { type: 'hub', name: 'local-cluster' }) {
  const filter = []

  // Add namespace filter
  if (namespace !== '--all-namespaces') filter.push({ property: 'namespace', values: [namespace] })

  // Add kind filter
  filter.push({ property: 'kind', values: [kind] })

  // Add group filter
  if (group.useAPIGroup && group.name != 'v1') filter.push({ property: 'apigroup', values: [group.name] })

  // Add cluster filter
  filter.push({ property: 'cluster', values: [cluster.name] })

  return filter
}

/**
 * Sends a search query requesting count.
 * @param {string} token Required. Token of the user initiating the request.
 * @param {keywords:[], filters:[], limit:number } input Required. The search query input.
 * @returns {number} Count of resources matching the search.
 */
async function resolveSearchCount(token, input) {
  const q = searchCountQuery(input)
  const r = await sendRequest(q, token)
  return lodash.get(r, 'body.data.searchResult[0].count', 0)
}

/**
 * Sends a search query requesting items.
 * @param {string} token Required. Token of the user initiating the request.
 * @param {keywords:[], filters:[], limit:number } input Required. The search query input.
 * @returns {[]} Array of resources matching the search.
 */
async function resolveSearchItems(token, input) {
  const q = searchQueryBuilder(input)
  const r = await sendRequest(q, token)
  return lodash.get(r, 'body.data.searchResult[0].items', [])
}

exports.getResourcesFromSearch = getResourcesFromSearch
exports.resolveSearchCount = resolveSearchCount
exports.resolveSearchItems = resolveSearchItems
exports.searchQueryBuilder = searchQueryBuilder
exports.sendRequest = sendRequest
