// Copyright Contributors to the Open Cluster Management project

jest.retryTimes(global.retry, { logErrorsBeforeRetry: true })

const squad = require('../../config').get('squadName')
const SEARCH_API_V1 = require('../../config').get('SEARCH_API_V1')
const { deleteResource, getResource, getSearchApiRoute, getKubeadminToken } = require('../common-lib/clusterAccess')
const { searchQueryBuilder, sendRequest } = require('../common-lib/searchClient')

const _ = require('lodash')

describe('RHACM4K-1696: Search API - Verify search result with common filter and conditions', () => {
  beforeAll(async () => {
    // Log in and get access token
    token = getKubeadminToken()

    // Create a route to access the Search API.
    searchApiRoute = await getSearchApiRoute()
  })

  const app = 'console'
  const namespace = 'openshift-console'

  // Skipping this test because it causes baseTest() to become unreliable.
  // Need to rewrite this test to vaidate the search state without depending on kubernetes logic.
  test.skip(`[P2][Sev2][${squad}] Verify search data is correct after a pod is deleted and recreated.`, async () => {
    var query = searchQueryBuilder({
      filters: [
        { property: 'kind', values: ['Deployment'] },
        { property: 'name', values: [app] },
        { property: 'namespace', values: [namespace] },
      ],
    })

    // Change state
    var pods = getResource('pod', namespace)
    await deleteResource('pod', pods[0][0], namespace)
  }, 20000)

  test(`[P2][Sev2][${squad}] Search kind application on specific namespace.`, async () => {
    var query = searchQueryBuilder({
      filters: [
        { property: 'kind', values: ['Deployment'] },
        { property: 'name', values: [app] },
        { property: 'namespace', values: [namespace] },
      ],
    })
    var res = await sendRequest(query, token)
    expect(res.body.data.searchResult[0].items[0].name).toEqual(app)
    expect(res.body.data.searchResult[0].items[0].kind).toMatch(/Deployment/i)
    expect(res.body.data.searchResult[0].items[0].namespace).toEqual(namespace)
  }, 20000)

  test(`[P2][Sev2][${squad}] Search kind pod and namespace open-cluster-management.`, async () => {
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

  test(`[P2][Sev2][${squad}] Search kind pod on specific cluster.`, async () => {
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

  test(`[P2][Sev2][${squad}] Search kind:ConfigMap namespace:open-cluster-management`, async () => {
    var query = searchQueryBuilder({
      filters: [
        { property: 'kind', values: ['ConfigMap'] },
        { property: 'namespace', values: ['open-cluster-management'] },
      ],
    })

    var res = await sendRequest(query, token)
    var configmap = _.get(res, 'body.data.searchResult[0].items', '')

    expect(configmap[0].kind).toMatch(/ConfigMap/i)
    expect(configmap.find((el) => el.namespace === 'open-cluster-management')).toBeDefined()
    expect(configmap.find((el) => el.name.includes('search'))).toBeDefined()
  }, 20000)

  test(`[P2][Sev2][${squad}] Search kind:Deployment namespace:open-cluster-management`, async () => {
    var query = searchQueryBuilder({
      filters: [
        { property: 'kind', values: ['Deployment'] },
        { property: 'namespace', values: ['open-cluster-management'] },
      ],
    })

    var res = await sendRequest(query, token)
    var deployment = _.get(res, 'body.data.searchResult[0].items', '')

    expect(deployment[0].kind).toMatch(/Deployment/i)
    expect(deployment.find((deploy) => deploy.namespace === 'open-cluster-management')).toBeDefined()
    expect(items.find((deploy) => deploy.name.includes('search-api'))).toBeDefined()
  }, 20000)
})
