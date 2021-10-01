// Copyright (c) 2020 Red Hat, Inc.

const squad = require('../../config').get('squadName')
const {
  getSearchApiRoute,
  searchQueryBuilder,
  getToken,
  sendRequest,
  getPods,
  deletePod,
} = require('../common-lib/clusterAccess')

describe('RHACM4K-1696: Search - Verify search result with common filter and conditions', () => {
  beforeAll(async () => {
    // Log in and get access token
    token = getToken()

    // Create a route to access the Search API.
    searchApiRoute = await getSearchApiRoute()

    // Temporary workaround. TODO: Get SSL cert from cluster.
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
  })

  const app = 'console'
  const namespace = 'openshift-console'

  test(`[P2][Sev2][${squad}] Verify a deleted pod is recreated.`, async () => {
    var query = searchQueryBuilder({
      filters: [
        { property: 'kind', values: ['deployment'] },
        { property: 'name', values: [app] },
        { property: 'namespace', values: [namespace] },
      ],
    })
    var res = await sendRequest(query, token)
    expect(res.body.data.searchResult[0].items[0].current).toEqual(2)
    var pods = getPods(namespace)
    deletePod(pods[0][0], namespace)
      .then(() => {
        var res = sendRequest(query, token)
        expect(res.body.data.searchResult[0].items[0].current).toEqual(2)
      })
      .catch(() => {})
  }, 20000)

  test(`[P2][Sev2][${squad}] Search kind application on specific namespace.`, async () => {
    var query = searchQueryBuilder({
      filters: [
        { property: 'kind', values: ['deployment'] },
        { property: 'name', values: [app] },
        { property: 'namespace', values: [namespace] },
      ],
    })
    var res = await sendRequest(query, token)
    expect(res.body.data.searchResult[0].items[0].name).toEqual(app)
    expect(res.body.data.searchResult[0].items[0].kind).toEqual('deployment')
    expect(res.body.data.searchResult[0].items[0].namespace).toEqual(namespace)
  }, 20000)

  test(`[P2][Sev2][${squad}] Search kind pod and namespace open-cluster-management.`, async () => {
    var query = searchQueryBuilder({
      filters: [
        { property: 'kind', values: ['pod'] },
        { property: 'namespace', values: ['open-cluster-management'] },
        { property: 'status', values: ['Running'] },
      ],
    })
    var res = await sendRequest(query, token)
    var pods = res.body.data.searchResult[0].items
    pods.forEach((element) => {
      expect(element.status).toEqual('Running')
    })
  }, 20000)

  test(`[P2][Sev2][${squad}] Search kind pod on specific cluster.`, async () => {
    var query = searchQueryBuilder({
      filters: [
        { property: 'kind', values: ['pod'] },
        { property: 'cluster', values: ['local-cluster'] },
        { property: 'status', values: ['Running'] },
      ],
    })
    var res = await sendRequest(query, token)
    var pods = res.body.data.searchResult[0].items
    pods.forEach((element) => {
      expect(element.status).toEqual('Running')
    })
  }, 20000)

  test(`[P2][Sev2][${squad}] Search kind:certpolicycontroller.`, async () => {
    var query = searchQueryBuilder({
      filters: [{ property: 'kind', values: ['certpolicycontroller'] }],
    })
    var res = await sendRequest(query, token)
    expect(res.body.data.searchResult[0].items[0].name).toEqual(
      'klusterlet-addon-certpolicyctrl'
    )
    expect(res.body.data.searchResult[0].items[0].kind).toEqual(
      'certpolicycontroller'
    )
    expect(res.body.data.searchResult[0].items[0].namespace).toEqual(
      'open-cluster-management-agent-addon'
    )
  }, 20000)

  test(`[P2][Sev2][${squad}] Search kind:iampolicycontroller.`, async () => {
    var query = searchQueryBuilder({
      filters: [{ property: 'kind', values: ['iampolicycontroller'] }],
    })
    var res = await sendRequest(query, token)
    expect(res.body.data.searchResult[0].items[0].name).toEqual(
      'klusterlet-addon-iampolicyctrl'
    )
    expect(res.body.data.searchResult[0].items[0].kind).toEqual(
      'iampolicycontroller'
    )
    expect(res.body.data.searchResult[0].items[0].namespace).toEqual(
      'open-cluster-management-agent-addon'
    )
  }, 20000)
})
