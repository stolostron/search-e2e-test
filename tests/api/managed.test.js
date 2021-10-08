// Copyright (c) 2020 Red Hat, Inc.

jest.retryTimes(global.retry);

const squad = require('../../config').get('squadName')
const {
  getSearchApiRoute,
  getToken,
  searchQueryBuilder,
  sendRequest,
} = require('../common-lib/clusterAccess')
const _ = require('lodash')

describe('RHACM4K-1695: Search - verify managed cluster info in the search page', () => {
  beforeAll(async () => {
    // Log in and get access token
    token = getToken()

    // Create a route to access the Search API.
    searchApiRoute = await getSearchApiRoute()

    // Temporary workaround. TODO: Get SSL cert from cluster.
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
  })

  // Cleanup and teardown here.
  afterAll(() => {})

  function log({ message = '' }) {
    console.log(message)
  }

  test(`[P1][Sev1][${squad}] Search - verify managed cluster info in the search page.`, async () => {
    var query = searchQueryBuilder({
      filters: [
        { property: 'name', values: ['!local-cluster'] },
        { property: 'ManagedClusterJoined', values: ['True'] },
      ],
    })
    var res = await sendRequest(query, token)
    if (_.get(res, 'body.data.searchResult[0].items[0]', '')) {
      expect(res.body.data.searchResult[0].items[0].ManagedClusterJoined).toEqual(
        'True'
      )

      query = searchQueryBuilder({
        filters: [
          { property: 'cluster', values: ['!local-cluster'] },
          { property: 'kind', values: ['pod'] },
          { property: 'namespace', values: ['open-cluster-management-agent'] },
        ],
      })
      res = await sendRequest(query, token)

      var pods = _.get(res, 'body.data.searchResult[0].items', [])
      pods.forEach((element) => {
        expect(element.status).toEqual('Running')
      })
    } else {
      log({
        message: 'Test skipped because no managedCluster detected.',
      })
    }
  }, 20000)
})