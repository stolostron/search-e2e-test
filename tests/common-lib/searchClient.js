// Copyright Contributors to the Open Cluster Management project

/*
 * This file has functions to interact with the Search API.
 */
const { fail } = require('assert')
const { performance } = require('perf_hooks')    
const request = require('supertest')
const lodash = require('lodash')

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
    // Build the search api query.
    const filters = formatFilters(kind, apigroup, namespace, cluster)
    const query = searchQueryBuilder({ filters })
    // Fetch data from the search api.
    const resp = await sendRequest(query, token)
  
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
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0 // Disable SSL validation so we can connect to the search-api route.
    
    // Monitor how long search took to return results.
    const startTime = performance.now()
     
    return request(searchApiRoute)
      .post('/searchapi/graphql')
      .send(query)
      .set({ Authorization: `Bearer ${token}` })
      .expect(200)
      .then((r) => {
        const endTime = performance.now()
        const totalElapsedTime = endTime - startTime
        
        if (totalElapsedTime > 10000) {
            fail(
                `Search required more than 10 seconds to return resources for query [${query}]. (TotalElapsedTime: ${totalElapsedTime})`
            )
        } else if (totalElapsedTime > 1000) {
            console.warn(
                `Search required more than 1 second to return resources for query [${query}]. (TotalElapsedTime: ${totalElapsedTime.toFixed(2)})`
            )
        } 
        
        return r   
      })
}

/**
 * Format resources for search queries.
 * @param {*} resources A list of resources that will be formated as an object containing name and namespace.
 * @returns `formatedResources` Formatted array of resource object.
 */
function formatResourcesFromSearch(resources) {
    return lodash.get(resources, 'body.data.searchResult[0].items')
        .filter((items) => items.namespace) // We're only interested in resources that have a namespace.
        .map((item) => ({
            cluster: item.cluster,
            kind: item.kind,
            name: item.name,
            namespace: item.namespace,
        }))
}

/**
 * Format filters for search queries.
 * @param {string} kind The kind of resource to filter.
 * @param {Object} group The API group to filter the resources against.
 * @param {string} namespace The namespace to filter the resources against.
 * @param {Object} cluster The cluster to filter the resources against.
 * @returns `filter` Formatted array of object filters.
 */
 function formatFilters(
    kind,
    group,
    namespace = '--all-namespaces',
    cluster = { type: 'hub', name: 'local-cluster' }
  ) {
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
  
exports.getResourcesFromSearch = getResourcesFromSearch
exports.searchQueryBuilder = searchQueryBuilder
exports.sendRequest = sendRequest
  
