// Copyright Contributors to the Open Cluster Management project

jest.retryTimes(global.retry, { logErrorsBeforeRetry: true })

const squad = require('../../config').get('squadName')
const { getUserContext, getSearchApiRoute } = require('../common-lib/clusterAccess')
const { ValidateSearchData, validationTimeout } = require('../common-lib/validateSearchData')
const { resolveSearchItems } = require('../common-lib/searchClient')
const { execSync } = require('child_process')
const { execCliCmdString, expectCli } = require('../common-lib/cliClient')
const { sleep } = require('../common-lib/sleep')

const ns = 'search-rbac'
const [usr0, usr1, usr2, usr3, usr4] = ['search-user0', 'search-user1', 'search-user2', 'search-user3', 'search-user4']

describe(`[P2][Sev2][${squad}] Search API: Verify RBAC`, () => {
  beforeAll(async () => {
    // Using ServiceAccounts for rbac tests because configuration is simpler.

    const setupCmds = `
    # export ns=search-rbac; export usr0=u0; export usr1=u1; export usr2=u2; export usr3=u3; export usr4=u4
    oc create namespace ${ns}
    oc create serviceaccount ${usr0} -n ${ns}
    oc create serviceaccount ${usr1} -n ${ns}
    oc create serviceaccount ${usr2} -n ${ns}
    oc create serviceaccount ${usr3} -n ${ns}
    oc create serviceaccount ${usr4} -n ${ns}
    oc create role ${usr1} --verb=get,list --resource=configmaps -n ${ns}
    oc create rolebinding ${usr1} --role=${usr1} --serviceaccount=${ns}:${usr1} -n ${ns}
    oc create clusterrole ${usr2} --verb=list,get --resource=nodes,configmaps
    oc create clusterrolebinding ${usr2} --clusterrole=${usr2} --serviceaccount=${ns}:${usr2}
    oc create rolebinding ${usr3} --clusterrole=admin --serviceaccount=${ns}:${usr3} -n ${ns}

    oc create role ${usr4} --verb=get,list --resource=deployment -n ${ns}
    oc create rolebinding ${usr4} --role=${usr4} --serviceaccount=${ns}:${usr4} -n ${ns}

    oc create deployment ${usr4} -n ${ns} --image=busybox --replicas=1 -- 'date; sleep 1; date; sleep 5;'
    oc patch deployment ${usr4} -n ${ns} -p '{"spec":{"template":{"spec":{"containers":[{"name":"busybox","imagePullPolicy":"IfNotPresent"}]}}}}'
    oc scale deployment ${usr4} -n ${ns} --replicas=5

    oc create configmap cm0 -n ${ns} --from-literal=key=cm0
    oc create configmap cm1 -n ${ns} --from-literal=key=cm1`

    // Run setup steps in parallel.
    // - Create a route to access the Search API.
    // - Create users and objects for this test.
    const [route] = await Promise.all([getSearchApiRoute(), execCliCmdString(setupCmds)])
    searchApiRoute = route

    await sleep(10000) // Wait for service account and the search index to get updated.
  }, 60000)

  afterAll(async () => {
    const teardownCmds = `
    # export ns=search-rbac; export usr2=u2
    oc delete ns ${ns}
    oc delete clusterrolebinding ${usr2}
    oc delete clusterrole ${usr2}`

    execCliCmdString(teardownCmds)
  }, 10000)

  describe(`with user ${usr0} (not authorized to list any resources)`, () => {
    beforeAll(async () => {
      user = await getUserContext({ usr: usr0, ns, retryWait: 4000 })
    })

    test('should validate RBAC configuration for user', () => {
      expectCli(`oc auth can-i list secret --as=${user.fullName}`).toThrow()
      expectCli(`oc auth can-i list configmap --as=${user.fullName}`).toThrow()
      expectCli(`oc auth can-i list node --as=${user.fullName}`).toThrow()
    })

    test('should not receive ConfigMap', () => ValidateSearchData({ user, kind: 'configmap' }), validationTimeout)
    test('should not receive Node', () => ValidateSearchData({ user, kind: 'node' }), validationTimeout)
    test('should not receive Secret', () => ValidateSearchData({ user, kind: 'secret' }), validationTimeout)
    test(`should not match any resources containing the keyword 'a'`, async () => {
      const items = await resolveSearchItems(user.token, { keywords: ['a'] })
      expect(items).toHaveLength(0)
      expect(items).toEqual([])
    })
    test(`should not match any resources in namespace ${ns}`, async () => {
      const items = await resolveSearchItems(user.token, { filters: [{ property: 'namespace', values: [ns] }] })
      expect(items).toHaveLength(0)
      expect(items).toEqual([])
    })
  })

  describe(`with user ${usr1} (configmap in namespace ${ns} only)`, () => {
    beforeAll(async () => {
      user = await getUserContext({ usr: usr1, ns, retryWait: 4000 })
    })

    test('should validate RBAC configuration for user', () => {
      expect(() => execSync(`oc auth can-i list secret -n ${ns} --as=${user.fullName}`)).toThrow()
      expect(() => execSync(`oc auth can-i list configmap -n ${ns} --as=${user.fullName}`)).not.toThrow()
    })

    test('should not receive Secret', () => ValidateSearchData({ user, kind: 'secret' }), validationTimeout)
    test('should receive ConfigMap', () => ValidateSearchData({ user, kind: 'configmap' }), validationTimeout)

    test(`should not match any ConfigMap from other namespaces`, async () => {
      const items = await resolveSearchItems(user.token, { filters: [{ property: 'kind', values: ['configmap'] }] })
      expect(items.find(({ namespace }) => namespace && namespace.toLowerCase() !== ns)).toEqual(undefined)
      expect(items.find(({ kind }) => kind && kind.toLowerCase() !== 'configmap')).toEqual(undefined)
    })

    test(`should not match any other kind`, async () => {
      const items = await resolveSearchItems(user.token, { filters: [{ property: 'kind', values: ['!configmap'] }] })
      expect(items).toHaveLength(0)
      expect(items).toEqual([])
    })
  })

  describe(`with user ${usr2} (nodes and configmap in all namespaces.)`, () => {
    beforeAll(async () => {
      user = await getUserContext({ usr: usr2, ns, retryWait: 4000 })
    })

    test('should validate RBAC configuration for user', () => {
      expectCli(`oc auth can-i list secret -n ${ns} --as=${user.fullName}`).toThrow()
      expectCli(`oc auth can-i list configmap -A --as=${user.fullName}`).not.toThrow()
      expectCli(`oc auth can-i list configmap -n ${ns} --as=${user.fullName}`).not.toThrow()
      expectCli(`oc auth can-i list node --as=${user.fullName}`).not.toThrow()
    })

    test('should not receive Secret', () => ValidateSearchData({ user, kind: 'secret' }), validationTimeout)
    test('should receive ConfigMap', () => ValidateSearchData({ user, kind: 'configmap' }), validationTimeout)
    test('should receive Node', () => ValidateSearchData({ user, kind: 'node' }), validationTimeout)
  })

  describe(`with user ${usr3} (admin for namespace ${ns})`, () => {
    beforeAll(async () => {
      user = await getUserContext({ usr: usr3, ns, retryWait: 4000 })
    })

    test('should validate RBAC configuration for user', () => {
      expectCli(`oc auth can-i list secret -n ${ns} --as=${user.fullName}`).not.toThrow()
      expectCli(`oc auth can-i list configmap -n ${ns} --as=${user.fullName}`).not.toThrow()
      expectCli(`oc auth can-i list configmap -n default --as=${user.fullName}`).toThrow()
      expectCli(`oc auth can-i list node --as=${user.fullName}`).toThrow()
    })

    test('should receive Secret', () => ValidateSearchData({ user, kind: 'secret' }), validationTimeout)
    test('should receive ConfigMap', () => ValidateSearchData({ user, kind: 'configmap' }), validationTimeout)
    test('should not receive Node', () => ValidateSearchData({ user, kind: 'node' }), validationTimeout)

    /* FIXME: Keeping this test disabled because user is also getting authorized to get ConfigMaps in
     * open-cluster-management. This is coming from Kubernetes, not search.
    test(`should not match resources from other namespaces`, async () => {
      expect(() => execSync(`oc auth can-i list configmap -n open-cluster-management --as=${user.fullName}`)).toThrow()
      const q = searchQueryBuilder({ filters: [{ property: 'kind', values: ['configmap'] }] })
      const res = await sendRequest(q, user.token)
      const items = res.body.data.searchResult[0].items

      expect(items.find(({ namespace }) => namespace.toLowerCase() !== ns)).toEqual(undefined)
    })
    */
  })

  describe(`with user ${usr4} (access to deployment but not pod)`, () => {
    beforeAll(async () => {
      user = await getUserContext({ usr: usr4, ns, retryWait: 4000 })
    })

    test('should validate RBAC configuration.', () => {
      expectCli(`oc auth can-i list secret -n ${ns} --as=${user.fullName}`).toThrow()
      expectCli(`oc auth can-i list pod -n ${ns} --as=${user.fullName}`).toThrow()
      expectCli(`oc auth can-i list deployment -n ${ns} --as=${user.fullName}`).not.toThrow()
    })

    test(`should not get Secret`, () => ValidateSearchData({ user, kind: 'secret', namespace: ns }), validationTimeout)
    test('should not get Pod', () => ValidateSearchData({ user, kind: 'configmap', namespace: ns }), validationTimeout)
    test(
      'should get Deploymt',
      () => ValidateSearchData({ user, kind: 'deployment', namespace: ns }),
      validationTimeout
    )

    test.todo('should validate relationship data is correct.')
  })

  // TODO: This scenario is not supported in V1 and not implemented for V2 yet.
  describe(`with user search-user5 (access to configmap cm0 only)`, () => {
    test.todo('should validate RBAC configuration.')
    test.todo('should validate results from search.')
  })

  describe(`with user search-user10 (all managed clusters)`, () => {
    test.todo('should validate RBAC configuration.')
    test.todo('should validate results from search.')
  })

  describe(`with user search-user11 (single managed cluster)`, () => {
    test.todo('should validate RBAC configuration.')
    test.todo('should validate results from search.')
  })
})
