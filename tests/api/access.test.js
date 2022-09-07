// Copyright Contributors to the Open Cluster Management project

jest.retryTimes(global.retry, { logErrorsBeforeRetry: true })

const squad = require('../../config').get('squadName')
const SEARCH_API_V1 = require('../../config').get('SEARCH_API_V1')
const { getSearchApiRoute, getKubeadminToken } = require('../common-lib/clusterAccess')
const { searchQueryBuilder } = require('../common-lib/searchClient')
const request = require('supertest')

describe(`[P1][Sev1][${squad}] Search API: Verify access:`, () => {
  const query = searchQueryBuilder({ filters: [{ property: 'kind', values: ['pod'] }] })

  beforeAll(async () => {
    // Log in and get access token
    token = getKubeadminToken()

    // Create a route to access the Search API.
    searchApiRoute = await getSearchApiRoute()

    // Disable SSL validation so we can connect to the search-api route.
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
  })

  test('should get 401 if authorization header is not present.', () => {
    return request(searchApiRoute).post('/searchapi/graphql').send(query).expect(401)
  })

  test('should get 401 if authorization token is invalid.', () => {
    return request(searchApiRoute)
      .post('/searchapi/graphql')
      .send(query)
      .set({ Authorization: 'Bearer invalidauthorizationtoken' })
      .expect(!!SEARCH_API_V1 ? 401 : 403)
  })

  test('should get 403 if authorization header missing Bearer.', () => {
    return request(searchApiRoute)
      .post('/searchapi/graphql')
      .send(query)
      .set({ Authorization: token }) // Missing Bearer.
      .expect(!!SEARCH_API_V1 ? 403 : 200)
  })

  test('should return results when searching for kind:pod.', () => {
    return request(searchApiRoute)
      .post('/searchapi/graphql')
      .send(query)
      .set({ Authorization: `Bearer ${token}` })
      .expect(200)
  }, 20000) // Timeout is high at 20 seconds because first search takes longer to build the rbac filter cache.
})
