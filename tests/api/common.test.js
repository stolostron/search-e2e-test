// Copyright Contributors to the Open Cluster Management project

jest.retryTimes(global.retry, { logErrorsBeforeRetry: true })

const squad = require('../../config').get('squadName')
const SEARCH_API_V1 = require('../../config').get('SEARCH_API_V1')
const { getSearchApiRoute, getKubeadminToken } = require('../common-lib/clusterAccess')
const { searchQueryBuilder, sendRequest } = require('../common-lib/searchClient')

const _ = require('lodash')

describe('RHACM4K-1696: Search API - Verify search result with common filter and conditions', () => {
  beforeAll(async () => {
    // Log in and get access token
    token = getKubeadminToken()

    // Create a route to access the Search API.
    searchApiRoute = await getSearchApiRoute()
  })

  test(`[P2][Sev2][${squad}] with query {kind:Deployment name:console namespace:openshift-console}`, async () => {
    var query = searchQueryBuilder({
      filters: [
        { property: 'kind', values: ['Deployment'] },
        { property: 'name', values: ['console'] },
        { property: 'namespace', values: ['openshift-console'] },
      ],
    })
    var res = await sendRequest(query, token)
    expect(res.body.data.searchResult[0].items[0].kind).toMatch(/Deployment/i)
    expect(res.body.data.searchResult[0].items[0].name).toEqual('console')
    expect(res.body.data.searchResult[0].items[0].namespace).toEqual('openshift-console')
  }, 20000)

  test(`[P2][Sev2][${squad}] with query {kind:Pod status:Running namespace:open-cluster-management}`, async () => {
    var query = searchQueryBuilder({
      filters: [
        { property: 'kind', values: ['Pod'] },
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

  test(`[P2][Sev2][${squad}] with query {kind:Pod cluster:local-cluster}`, async () => {
    var query = searchQueryBuilder({
      filters: [
        { property: 'kind', values: ['Pod'] },
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

  // Skipping this test because it fails intermittently, which creates unreliable results.
  test.skip(`[P2][Sev2][${squad}] with query {kind:ConfigMap namespace:open-cluster-management}`, async () => {
    var query = searchQueryBuilder({
      filters: [
        { property: 'kind', values: ['ConfigMap'] },
        { property: 'namespace', values: ['open-cluster-management'] },
      ],
    })

    var res = await sendRequest(query, token)
    var items = res.body.data.searchResult[0].items

    expect(items[0].kind).toMatch(/ConfigMap/i)
    expect(items.find((el) => el.namespace === 'open-cluster-management')).toBeDefined()
    expect(items.find((el) => el.name.includes('search'))).toBeDefined()
  }, 20000)

  // Skipping this test because it fails intermittently, which creates unreliable results.
  test.skip(`[P2][Sev2][${squad}] with query {kind:Deployment namespace:open-cluster-management}`, async () => {
    var query = searchQueryBuilder({
      filters: [
        { property: 'kind', values: ['Deployment'] },
        { property: 'namespace', values: ['open-cluster-management'] },
      ],
    })

    var res = await sendRequest(query, token)
    var items = res.body.data.searchResult[0].items

    expect(items[0].kind).toMatch(/Deployment/i)
    expect(items.find((deploy) => deploy.namespace === 'open-cluster-management')).toBeDefined()
    expect(items.find((deploy) => deploy.name.includes('search-api'))).toBeDefined()
  }, 20000)
})
