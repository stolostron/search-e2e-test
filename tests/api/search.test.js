// Copyright (c) 2020 Red Hat, Inc.

const { getSearchApiRoute, getToken, searchQueryBuilder, sendRequest } = require('../common-lib/clusterAccess')

describe('RHACM4K-912 - Search - verify managed cluster info in the search page', () => {

  beforeAll(async () => {
    // Log in and get access token
    token = getToken()

    // Create a route to access the Search API.
    searchApiRoute = await getSearchApiRoute()

    // Temporary workaround. TODO: Get SSL cert from cluster.
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
  })

  // Cleanup and teardown here.
  afterAll(() => {
  })

  test('RHACM4K-912 - Search - verify managed cluster info in the search page.', async () => {
    var query = searchQueryBuilder({ filters: [{ property: 'ManagedClusterJoined', values: ['True'] }] })
    var res = await sendRequest(query, token)
    expect(res.body.data.searchResult[0].items[0].ManagedClusterJoined).toEqual("True")
    expect(res.body.data.searchResult[0].items[0].status).toEqual("OK")

    query = searchQueryBuilder({ filters: [{ property: 'kind', values: ['cluster'] }] })
    res = await sendRequest(query, token)
    expect(res.body.data.searchResult[0].items[0].kind).toEqual("cluster")
    expect(res.body.data.searchResult[0].items[0].name).toEqual("local-cluster")

    query = searchQueryBuilder({ filters: [{ property: 'kind', values: ['pod'] }] })
    res = await sendRequest(query, token)
    expect(res.body.data.searchResult[0].items[0].kind).toEqual("pod")

    query = searchQueryBuilder({ filters: [{ property: 'cluster', values: ['local-cluster'] },
                                           { property: 'kind', values: ['pod'] },
                                           { property: 'namespace', values: ['open-cluster-management-agent'] }] })
    res = await sendRequest(query, token)

    var pods = res.body.data.searchResult[0].items
    pods.forEach(element => {
      expect(element.status).toEqual("Running")
    })
  }, 20000)
})
