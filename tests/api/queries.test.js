// Copyright Contributors to the Open Cluster Management project

jest.retryTimes(global.retry, { logErrorsBeforeRetry: true })

const squad = require('../../config').get('squadName')
const { getUserContext, getSearchApiRoute } = require('../common-lib/clusterAccess')
const { execCliCmdString } = require('../common-lib/cliClient')
const { searchQueryBuilder, sendRequest } = require('../common-lib/searchClient')
const { sleep } = require('../common-lib/sleep')

const SEARCH_API_V1 = true
const usr = 'search-query-user'
const ns = 'search-query'

describe(`[P3][Sev3][${squad}] Search API - Verify results of different queries`, () => {
  beforeAll(async () => {
    let setupCommands = `# export ns=search-query; export usr=search-query-user
    oc create namespace ${ns}
    oc create serviceaccount ${usr} -n ${ns}
    oc create role ${usr} --verb=get,list --resource=configmaps -n ${ns}
    oc create rolebinding ${usr} --role=${usr} --serviceaccount=${ns}:${usr} -n ${ns}

    oc create configmap cm0 -n ${ns} --from-literal=key=cm0
    oc create configmap cm1 -n ${ns} --from-literal=key=cm1
    oc create configmap cm2-apple -n ${ns} --from-literal=key=cm2
    oc label configmap cm2-apple -n ${ns} type=fruit
    oc create configmap cm3-avocado -n ${ns} --from-literal=key=cm3
    oc label configmap cm3-avocado -n ${ns} type=vegetable
    oc create configmap cm4-broccoli -n ${ns} --from-literal=key=cm4
    oc label configmap cm4-broccoli -n ${ns} type=vegetable
    `

    // The V1 logic requires that user has access to list namespaces.
    if (SEARCH_API_V1) {
      setupCommands += `
    oc create clusterrole ${usr} --verb=list,get --resource=namespaces
    oc create clusterrolebinding ${usr} --clusterrole=${usr} --serviceaccount=${ns}:${usr}`
    }

    // Run the setup steps in parallel.
    const [route] = await Promise.all([getSearchApiRoute(), execCliCmdString(setupCommands)])
    searchApiRoute = route

    await sleep(20000) // Wait for the service account and search index to get updated.
    user = await getUserContext({ usr, ns, retryWait: 9000 })
  }, 60000)

  afterAll(async () => {
    let teardownCmds = `# export ns=search-query; export usr=search-query-user
    oc delete ns ${ns}`

    if (SEARCH_API_V1) {
      teardownCmds += `
      oc delete clusterrole ${usr}
      oc delete clusterrolebinding ${usr}`
    }

    execCliCmdString(teardownCmds)
  }, 15000)

  describe(`using keywords`, () => {
    test(`should match any resources containing the keyword 'apple'`, async () => {
      const q = searchQueryBuilder({ keywords: ['apple'] })
      const res = await sendRequest(q, user.token)
      const items = res.body.data.searchResult[0].items
      expect(items.length).toEqual(1)
      expect(items[0].name).toEqual('cm2-apple')
    })

    test(`should match resources with text containing 'apple' AND 'cm2'`, async () => {
      const q = searchQueryBuilder({ keywords: ['apple', 'cm2'] })
      const res = await sendRequest(q, user.token)
      const items = res.body.data.searchResult[0].items
      expect(items.length).toEqual(1)
      expect(items[0].name).toEqual('cm2-apple')
    })

    test('should be case insensitive.', async () => {
      const q = searchQueryBuilder({ keywords: ['ApPLe'] })
      const res = await sendRequest(q, user.token)
      const items = res.body.data.searchResult[0].items
      expect(items.length).toEqual(1)
      expect(items[0].name).toEqual('cm2-apple')
    })

    test(`should match resources where label text contains 'vegetable'`, async () => {
      const q = searchQueryBuilder({ keywords: ['vegetable'] })
      const res = await sendRequest(q, user.token)
      const items = res.body.data.searchResult[0].items
      const names = items.map((i) => i.name)

      expect(items.length).toEqual(2)
      expect(names).toEqual(expect.arrayContaining(['cm3-avocado', 'cm4-broccoli']))
    })
  })

  describe('using labels', () => {
    test(`should match resources containing the label 'fruit'`, async () => {
      const q = searchQueryBuilder({ filters: [{ property: 'label', values: ['type=fruit'] }] })
      const res = await sendRequest(q, user.token)
      const items = res.body.data.searchResult[0].items
      expect(items.length).toEqual(1)
      expect(items[0].name).toEqual('cm2-apple')
    })

    test('should match resources containing labelA OR labelB.', async () => {
      const q = searchQueryBuilder({ filters: [{ property: 'label', values: ['type=fruit', 'type=vegetable'] }] })
      const res = await sendRequest(q, user.token)
      const items = res.body.data.searchResult[0].items
      const names = items.map((i) => i.name)

      expect(items.length).toEqual(3)
      expect(names).toEqual(expect.arrayContaining(['cm2-apple', 'cm3-avocado', 'cm4-broccoli']))
    })
  })

  describe(`using the filter 'kind'`, () => {
    // FIXME: Skipping failing test.
    test.skip('should be case sensitive (lowercase).', async () => {
      const q = searchQueryBuilder({ filters: [{ property: 'kind', values: ['configmap'] }] })
      const q2 = searchQueryBuilder({ filters: [{ property: 'kind', values: ['ConfigMap'] }] })
      const [res, res2] = await Promise.all([sendRequest(q, user.token), sendRequest(q2, user.token)])
      const items = res.body.data.searchResult[0].items
      const items2 = res2.body.data.searchResult[0].items

      expect(items.length).toEqual(7) // <- FIXME: Test is failing here.
      expect(items2.length).toEqual(0)
    })
    test.todo('should only match resources of kind a,b, OR c.')
  })

  describe(`[${squad}] search using comparison operators`, () => {
    test.todo('should match resources created within the last hour.')
    test.todo('should match numerical property = {value}')
    test.todo('should match numerical property > {value}')
    test.todo('should match numerical property < {value}')
    test.todo('should match numerical property >= {value}')
    test.todo('should match numerical property <= {value}')
    test.todo('should match property where {value} is not equal to string')
  })

  describe(`[${squad}] search with multiple filters and values (AND/OR)`, () => {
    test.todo('should match resources in namespace a OR b.')
    test.todo('should match resources in namespace a AND name b OR c.')
    test.todo('should match resources in namespace a AND contains keyword xyz.')
  })

  describe(`[${squad}] search by count`, () => {
    test.todo('should return expected count.')
  })

  describe(`[${squad}] search with limit`, () => {
    test.todo('should return LIMIT or less resources.')
  })

  describe(`[${squad}] search complete`, () => {
    test.todo('should return all values for ${property}.')
  })

  describe(`[${squad}] single request with multiple search queries`, () => {
    test.todo('should resolve all requests.')
  })

  describe(`[${squad}] search for relationship`, () => {
    test.todo('should return relationship count for ${RESOURCE}')
    test.todo('should return relationship items')
    test.todo('should return relationship filtered by [releatedKinds]')
  })
})
