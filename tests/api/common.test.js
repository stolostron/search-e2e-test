// Copyright Contributors to the Open Cluster Management project

jest.retryTimes(global.retry)

const squad = require('../../config').get('squadName')
const {
  deleteResource,
  getResource,
  getSearchApiRoute,
  getToken,
} = require('../common-lib/clusterAccess')
const { searchQueryBuilder, sendRequest } = require('../common-lib/searchClient')
// const { baseTest } = require('./api-resources.test.js')

const _ = require('lodash')

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

  // Skipping this test because it causes baseTest() to become unreliable.
  // Need to rewrite this test to vaidate the search state without depending on kubernetes logic.
  test.skip(`[P2][Sev2][${squad}] Verify search data is correct after a pod is deleted and recreated.`, async () => {
    var query = searchQueryBuilder({
      filters: [
        { property: 'kind', values: ['deployment'] },
        { property: 'name', values: [app] },
        { property: 'namespace', values: [namespace] },
      ],
    })

    // Change state
    var pods = getResource('pod', namespace)
    await deleteResource('pod', pods[0][0], namespace)

    // Validate search data.
    // baseTest('pod', '')
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

  test(`[P2][Sev2][${squad}] Search kind:configmap.`, async () => {
    var query = searchQueryBuilder({
      filters: [{ property: 'kind', values: ['configmap'] }],
    })

    var res = await sendRequest(query, token)
    var configmap = _.get(res, 'body.data.searchResult[0].items', '')

    expect(configmap[0].kind).toEqual('configmap')
    expect(
      configmap.find((el) => el.namespace === 'open-cluster-management')
    ).toBeDefined()
    expect(configmap.find((el) => el.name.includes('search'))).toBeDefined()
  }, 20000)

  test(`[P2][Sev2][${squad}] Search kind:deployment.`, async () => {
    var query = searchQueryBuilder({
      filters: [{ property: 'kind', values: ['deployment'] }],
    })

    var res = await sendRequest(query, token)
    var deployment = _.get(res, 'body.data.searchResult[0].items', '')

    expect(deployment[0].kind).toEqual('deployment')
    expect(
      deployment.find(
        (deploy) => deploy.namespace === 'open-cluster-management'
      )
    ).toBeDefined()
    expect(
      deployment.find((deploy) => deploy.name.includes('search-prod'))
    ).toBeDefined()
  }, 20000)
})
