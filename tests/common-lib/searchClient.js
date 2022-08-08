// Copyright Contributors to the Open Cluster Management project

/*
 * This file has functions to interact with the Search API.
 */
const { fail } = require('assert')
const { performance } = require('perf_hooks')    
const {
    formatResourcesFromSearch,
    formatFilters } = require('./index')
const request = require('supertest')

/**
 * Query the Search API using the given filters.
 * 
 * @param {*} kind The kind filter
 * @param {*} apigroup The apigroup filter
 * @param {*} cluster The cluster fiilter.
 * @param {*} namespace The namespace filter.
 */
async function getResourcesFromSearch(kind,
    apigroup,
    namespace = '--all-namespaces',
    cluster = { type: 'hub', name: 'local-cluster' }){
    const filters = formatFilters(kind, apigroup, namespace, cluster)
  
    // Fetch data from the search api.
    var query = searchQueryBuilder({ filters })
  
    // Monitor how long search took to return results.
    var startTime = performance.now()
    var resp = await sendRequest(query, token)
    var endTime = performance.now()
    var totalElapsedTime = endTime - startTime
  
    if (totalElapsedTime > 30000) {
      fail(
        `Search required more than 30 seconds to return resources for ${kind}. (TotalElapsedTime: ${totalElapsedTime})`
      )
    } else if (totalElapsedTime > 1000) {
      console.warn(
        `Search required more than 1 second to return resources for ${kind}. (TotalElapsedTime: ${totalElapsedTime.toFixed(
          2
        )})`
      )
    }
  
    return formatResourcesFromSearch(resp)
  }

/**
 * Builds and returns a query object for a HTTP request. (Current supported input keys: `keywords`, `filters`, and `limit`)
 * @param {object} {} The input keys that will be used to build the query object.
 * @param {object} options Additional options for building the query object..
 * @returns {object} The query object.
 */
 function searchQueryBuilder(
    { keywords = [], filters = [], limit = 10000 },
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
  
exports.getResourcesFromSearch = getResourcesFromSearch
exports.searchQueryBuilder = searchQueryBuilder
exports.sendRequest = sendRequest
  
