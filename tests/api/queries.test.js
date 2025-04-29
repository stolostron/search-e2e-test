// Copyright Contributors to the Open Cluster Management project

jest.retryTimes(global.retry, { logErrorsBeforeRetry: true })

const squad = require('../../config').get('squadName')
const { getUserContext, getSearchApiRoute } = require('../common-lib/clusterAccess')
const { execCliCmdString } = require('../common-lib/cliClient')
const { resolveSearchCount, resolveSearchItems } = require('../common-lib/searchClient')
const { sleep } = require('../common-lib/sleep')

const usr = 'search-query-user'
const ns = 'search-query'

describe(`[P3][Sev3][${squad}] Search API - Verify results of different queries`, () => {
  beforeAll(async () => {
    let setupCommands = `# export ns=search-query; export usr=search-query-user
    oc create namespace ${ns}
    oc create serviceaccount ${usr} -n ${ns}
    oc create role ${usr} --verb=list --resource=configmap,deployment,replicaset -n ${ns}
    oc create rolebinding ${usr} --role=${usr} --serviceaccount=${ns}:${usr} -n ${ns}

    oc create configmap cm0 -n ${ns} --from-literal=key=cm0
    oc create configmap cm1 -n ${ns} --from-literal=key=cm1
    oc create configmap cm2-apple -n ${ns} --from-literal=key=cm2
    oc label configmap cm2-apple -n ${ns} type=fruit
    oc create configmap cm3-avocado -n ${ns} --from-literal=key=cm3
    oc label configmap cm3-avocado -n ${ns} type=vegetable
    oc create configmap cm4-broccoli -n ${ns} --from-literal=key=cm4
    oc label configmap cm4-broccoli -n ${ns} type=vegetable

    oc create deployment ${usr} -n ${ns} --image=busybox --replicas=0 -- 'date; sleep 60;'`

    // Run the setup steps in parallel.
    const [route] = await Promise.all([getSearchApiRoute(), execCliCmdString(setupCommands)])
    searchApiRoute = route

    // Wait for the service account and search index to get updated.
    // Must wait 2 minutes because of the current RBAC cache.
    // another 1 minute grace period added to ensure resources indexed
    await sleep(120000 + 60000)
  }, 1500000)

  // Keep separate from beforeAll because it slows execution and increases the chances of recovering during retry.
  beforeEach(async () => {
    await sleep(5000)
    user = await getUserContext({ usr, ns })
  }, 10000)

  afterAll(async () => {
    let teardownCmds = `# export ns=search-query; export usr=search-query-user
    oc delete ns ${ns}`

    await execCliCmdString(teardownCmds)
  }, 30000)

  describe(`using keywords`, () => {
    test(`should match any resources containing the keyword 'apple'`, async () => {
      const items = await resolveSearchItems(user.token, { keywords: ['apple'] })
      expect(items).toHaveLength(1)
      expect(items[0]).toHaveProperty('name', 'cm2-apple')
    })

    test(`should match resources with text containing 'apple' AND 'cm2'`, async () => {
      const items = await resolveSearchItems(user.token, { keywords: ['apple', 'cm2'] })
      expect(items).toHaveLength(1)
      expect(items[0]).toHaveProperty('name', 'cm2-apple')
    })

    test('should be case insensitive.', async () => {
      const items = await resolveSearchItems(user.token, { keywords: ['ApPLe'] })
      expect(items).toHaveLength(1)
      expect(items[0]).toHaveProperty('name', 'cm2-apple')
    })

    test(`should match resources where label text contains 'vegetable'`, async () => {
      const items = await resolveSearchItems(user.token, { keywords: ['vegetable'] })
      const names = items.map((i) => i.name)
      expect(items).toHaveLength(2)
      expect(names).toEqual(expect.arrayContaining(['cm3-avocado', 'cm4-broccoli']))
    })
  })

  describe('using labels', () => {
    test(`should match resources containing the label 'fruit'`, async () => {
      const items = await resolveSearchItems(user.token, { filters: [{ property: 'label', values: ['type=fruit'] }] })
      expect(items).toHaveLength(1)
      expect(items[0]).toHaveProperty('name', 'cm2-apple')
    })

    test('should match resources containing labelA OR labelB.', async () => {
      const items = await resolveSearchItems(user.token, {
        filters: [{ property: 'label', values: ['type=fruit', 'type=vegetable'] }],
      })
      const names = items.map((i) => i.name)

      expect(items).toHaveLength(3)
      expect(names).toEqual(expect.arrayContaining(['cm2-apple', 'cm3-avocado', 'cm4-broccoli']))
    })
  })

  describe('using partial match', () => {
    test(`should match resources containing the partial string 'typ*=*fru*' in label`, async () => {
      const items = await resolveSearchItems(user.token, { filters: [{ property: 'label', values: ['typ*=*fru*'] }] })
      expect(items).toHaveLength(1)
      expect(items[0]).toHaveProperty('name', 'cm2-apple')
    })

    test('should match resources partially matching labelA OR labelB.', async () => {
      const items = await resolveSearchItems(user.token, {
        filters: [{ property: 'label', values: ['type=fru*', 'type=veg*'] }],
      })
      const names = items.map((i) => i.name)

      expect(items).toHaveLength(3)
      expect(names).toEqual(expect.arrayContaining(['cm2-apple', 'cm3-avocado', 'cm4-broccoli']))
    })

    test('should match resources partially matching labelA.', async () => {
      const items = await resolveSearchItems(user.token, {
        filters: [{ property: 'label', values: ['type*'] }],
      })
      const names = items.map((i) => i.name)

      expect(items).toHaveLength(3)
      expect(names).toEqual(expect.arrayContaining(['cm2-apple', 'cm3-avocado', 'cm4-broccoli']))
    })

    test('should match resources partially matching on kind.', async () => {
      const items = await resolveSearchItems(user.token, {
        filters: [
          { property: 'kind', values: ['Conf*'] },
          { property: 'name', values: ['cm*'] },
        ],
      })
      const names = items.map((i) => i.name)

      expect(items).toHaveLength(5)
      expect(names).toEqual(expect.arrayContaining(['cm0', 'cm1', 'cm2-apple', 'cm3-avocado', 'cm4-broccoli']))
    })
  })

  describe(`using the filter 'kind'`, () => {
    test('should be case sensitive (lowercase).', async () => {
      const [items, items2] = await Promise.all([
        resolveSearchItems(user.token, { filters: [{ property: 'kind', values: ['deployment'] }] }),
        resolveSearchItems(user.token, { filters: [{ property: 'kind', values: ['Deployment'] }] }),
      ])

      expect(items).toHaveLength(1)
      expect(items2).toHaveLength(1)
    })
  })

  describe('search using comparison operators', () => {
    test(`should match resources in namespace ${ns} created within the last hour`, async () => {
      const items = await resolveSearchItems(user.token, {
        filters: [
          { property: 'namespace', values: [ns] }, // Limit to namespace created by test
          { property: 'kind', values: ['!Pod'] }, // and exclude Pod to keep test stable.
          { property: 'created', values: ['hour'] },
        ],
      })
      expect(items).toHaveLength(9)
    })

    test('should match resources where desired = 0', async () => {
      const items = await resolveSearchItems(user.token, { filters: [{ property: 'desired', values: ['=0'] }] })
      expect(items).toHaveLength(2)
      const kinds = items.map((i) => i.kind)
      expect(kinds).toEqual(expect.arrayContaining(['Deployment', 'ReplicaSet']))
    })

    // TODO: Skiping because this depends on kubernetes creating the pod, which could cause intermittent test failures.
    test.skip('should match resources where current > 3', async () => {
      const items = await resolveSearchItems(user.token, { filters: [{ property: 'current', values: ['>3'] }] })
      expect(items).toHaveLength(2)
      const kinds = items.map((i) => i.kind)
      expect(kinds).toEqual(expect.arrayContaining(['Deployment', 'ReplicaSet']))
    })

    test('should match deployments where available < 3', async () => {
      const items = await resolveSearchItems(user.token, { filters: [{ property: 'available', values: ['<3'] }] })
      expect(items).toHaveLength(1)
      expect(items[0]).toHaveProperty('name', usr)
    })

    test('should match deployments where desired <= 5', async () => {
      const items = await resolveSearchItems(user.token, { filters: [{ property: 'desired', values: ['<=5'] }] })
      expect(items).toHaveLength(2)
    })

    // TODO: Skiping because this depends on kubernetes creating the pod, which could cause intermittent test failures.
    test.skip('should match resources where current >= 5', async () => {
      const items = await resolveSearchItems(user.token, { filters: [{ property: 'current', values: ['>=5'] }] })
      expect(items).toHaveLength(1)
      expect(items[0]).toHaveProperty('kind', 'Deployment')
    })

    // TODO: Skiping because this depends on kubernetes creating the pod, which could cause intermittent test failures.
    test.skip('should match resources where kind is not namespace and status is not Running', async () => {
      const items = await resolveSearchItems(user.token, {
        filters: [
          { property: 'kind', values: ['!Namespace'] },
          { property: 'status', values: ['!Running'] },
        ],
      })
      expect(items).toHaveLength(7)
    })
  })

  describe('search with multiple filters and values (AND/OR)', () => {
    test.todo('should match resources in namespace a OR b.')
    test.todo('should match resources in namespace a AND name b OR c.')
    test.todo('should match resources in namespace a AND contains keyword xyz.')
    test.todo('should only match resources of kind a, b, OR c.')
  })

  describe('search by count', () => {
    test('should return expected count.', async () => {
      const count = await resolveSearchCount(user.token, {
        filters: [{ property: 'label', values: ['type=fruit', 'type=vegetable'] }],
      })
      expect(count).toEqual(3)
    })
  })

  describe('search with limit', () => {
    test('should return LIMIT or less resources.', async () => {
      const items = await resolveSearchItems(user.token, {
        filters: [{ property: 'kind', values: ['configmap'] }],
        limit: 2,
      })
      expect(items).toHaveLength(2)
    })
  })

  describe('search complete', () => {
    test.todo('should return all values for ${property}.')
  })

  describe('single request with multiple search queries', () => {
    test.todo('should resolve all requests.')
  })

  describe('search for relationship', () => {
    test.todo('should return relationship count for ${RESOURCE}')
    test.todo('should return relationship items')
    test.todo('should return relationship filtered by [releatedKinds]')
  })
})
