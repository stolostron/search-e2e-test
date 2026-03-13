// Copyright Contributors to the Open Cluster Management project

// Test pagination functionality of the Search API.
// Pagination is implemented using OFFSET, LIMIT, and ORDER BY.

jest.retryTimes(global.retry, { logErrorsBeforeRetry: true })

const squad = require('../../config').get('squadName')
const { getSearchApiRoute, getKubeadminToken } = require('../common-lib/clusterAccess')
const { execCliCmdString } = require('../common-lib/cliClient')
const {
  resolveSearchCount,
  resolveSearchItems,
  sendRequest,
  searchQueryBuilder,
} = require('../common-lib/searchClient')
const { sleep } = require('../common-lib/sleep')

const ns = 'search-auto-pagination'
const TOTAL_CONFIGMAPS = 12 // cm0 through cm11

describe(`[P3][Sev3][${squad}] Search API - Verify pagination functionality`, () => {
  beforeAll(async () => {
    token = getKubeadminToken()

    const setupCmds = `
    oc create namespace ${ns}
    oc create configmap cm0 -n ${ns} --from-literal=key=cm0
    oc create configmap cm1 -n ${ns} --from-literal=key=cm1
    oc create configmap cm2 -n ${ns} --from-literal=key=cm2
    oc create configmap cm3 -n ${ns} --from-literal=key=cm3
    oc create configmap cm4 -n ${ns} --from-literal=key=cm4
    oc create configmap cm5 -n ${ns} --from-literal=key=cm5
    oc create configmap cm6 -n ${ns} --from-literal=key=cm6
    oc create configmap cm7 -n ${ns} --from-literal=key=cm7
    oc create configmap cm8 -n ${ns} --from-literal=key=cm8
    oc create configmap cm9 -n ${ns} --from-literal=key=cm9
    oc create configmap cm10 -n ${ns} --from-literal=key=cm10
    oc create configmap cm11 -n ${ns} --from-literal=key=cm11
    `

    const [route] = await Promise.all([getSearchApiRoute(), execCliCmdString(setupCmds)])
    searchApiRoute = route

    await sleep(10000) // Wait for search index to get updated.
  }, 60000)

  afterAll(async () => {
    const teardownCmds = `
    oc delete namespace ${ns} --ignore-not-found --wait=true
    `
    await execCliCmdString(teardownCmds)
  }, 30000)

  const baseFilters = [
    { property: 'kind', values: ['ConfigMap'] },
    { property: 'namespace', values: [ns] },
    { property: 'cluster', values: ['local-cluster'] },
  ]

  test('should return correct total count', async () => {
    const count = await resolveSearchCount(token, { filters: baseFilters })
    expect(count).toBe(TOTAL_CONFIGMAPS + 2) //+2 because of the default configmaps
  })

  test('should respect limit and return first page of items', async () => {
    const items = await resolveSearchItems(token, {
      filters: baseFilters,
      limit: 5,
      offset: 0,
      orderBy: 'name asc',
    })
    expect(items).toHaveLength(5)
  })

  test('should respect offset and return second page of items', async () => {
    const items = await resolveSearchItems(token, {
      filters: baseFilters,
      limit: 5,
      offset: 5,
      orderBy: 'name asc',
    })
    expect(items).toHaveLength(5)
  })

  test('should return remaining items when offset + limit exceeds total', async () => {
    const items = await resolveSearchItems(token, {
      filters: baseFilters,
      limit: 5,
      offset: 10,
      orderBy: 'name asc',
    })
    expect(items).toHaveLength(2 + 2) // cm10, cm11 + 2 default configmaps
  })

  test('should return items ordered by name ascending', async () => {
    const items = await resolveSearchItems(token, {
      filters: baseFilters,
      limit: 3,
      offset: 0,
      orderBy: 'name asc',
    })
    expect(items).toHaveLength(3)
    // Lexicographic order: cm0, cm1, cm10, cm11, cm12, cm2, ...
    const names = items.map((i) => i.name)
    expect(names[0]).toBe('cm0')
    expect(names[1]).toBe('cm1')
    expect(names[2]).toBe('cm10')
  })

  test('should return items ordered by name descending', async () => {
    const items = await resolveSearchItems(token, {
      filters: baseFilters,
      limit: 3,
      offset: 2,
      orderBy: 'name desc',
    })
    expect(items).toHaveLength(3)
    const names = items.map((i) => i.name)
    expect(names[0]).toBe('cm9')
    expect(names[1]).toBe('cm8')
    expect(names[2]).toBe('cm7')
  })

  test('should return count and items when includeCount is true', async () => {
    const query = searchQueryBuilder({
      filters: baseFilters,
      limit: 5,
      offset: 0,
      orderBy: 'name asc',
      includeCount: true,
    })
    const res = await sendRequest(query, token)
    const result = res.body.data.searchResult[0]
    expect(result.count).toBe(TOTAL_CONFIGMAPS + 2) //+2 because of the default configmaps
    expect(result.items).toHaveLength(5)
  })
})
