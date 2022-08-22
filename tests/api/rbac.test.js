// Copyright Contributors to the Open Cluster Management project

jest.retryTimes(global.retry)

const squad = require('../../config').get('squadName')
const { getSearchApiRoute } = require('../common-lib/clusterAccess')
const { ValidateSearchData, validationTimeout } = require('../common-lib/validateSearchData')
const { execSync } = require('child_process')
const { execCliCmdString } = require('../common-lib/cliClient')

const ns = 'search-rbac'
const [usr0, usr1, usr2, usr3] = ['search-user0', 'search-user1', 'search-user2', 'search-user3']

function buildUserObject(userName) {
  return {
    fullName: `system:serviceaccount:${ns}:${userName}`,
    name: userName,
    namespace: ns,
    token: execSync(`oc serviceaccounts get-token ${userName} -n ${ns}`),
  }
}

describe(`[${squad}] Search API: Verify RBAC`, () => {
  beforeAll(async () => {
    // Usng ServiceAccounts for these tests because somfiguration is simpler.

    const setupCmds = `
    # export ns=search-rbac; export usr0=search-user0; export usr1=search-user1; export usr2=search-user2
    oc new-project ${ns}
    oc create serviceaccount ${usr0}
    oc create serviceaccount ${usr1}
    oc create serviceaccount ${usr2}
    oc create role ${usr1} --verb=get,list --resource=configmaps
    oc create rolebinding ${usr1} --role=${usr1} --serviceaccount=${ns}:${usr1}
    oc create clusterrole ${usr2} --verb=list,get --resource=nodes,configmaps
    oc create clusterrolebinding ${usr2} --clusterrole=${usr2} --serviceaccount=${ns}:${usr2}
    oc create configmap cm0 -n ${ns} --from-literal=key=cm0
    oc create configmap cm1 -n ${ns} --from-literal=key=cm1`

    // Run setup steps in parallel
    // - Create a route to access the Search API.
    // - Create users and objects for this test.
    const [route] = await Promise.all([getSearchApiRoute(), execCliCmdString(setupCmds)])
    searchApiRoute = route
  }, 20000)

  afterAll(async () => {
    const teardownCmds = `
    # export ns=search-rbac; export usr2=search-user2
    oc delete ns ${ns}
    oc delete clusterrolebinding ${usr2}
    oc delete clusterrole ${usr2}`

    execCliCmdString(teardownCmds)
  }, 10000)

  describe(`with user ${usr0} (not authorized to list any resources)`, () => {
    beforeAll(() => {
      user = buildUserObject(usr0)
    })

    test('should validate RBAC configuration for user', () => {
      expect(() => execSync(`oc auth can-i list secret --as=${user.fullName}`)).toThrow()
      expect(() => execSync(`oc auth can-i list configmap --as=${user.fullName}`)).toThrow()
      expect(() => execSync(`oc auth can-i list node --as=${user.fullName}`)).toThrow()
    })

    test('should not receive ConfigMap', () => ValidateSearchData({ kind: 'configmap', user }), validationTimeout)
    test('should not receive Node', () => ValidateSearchData({ kind: 'node', user }), validationTimeout)
    test('should not receive Secret', () => ValidateSearchData({ kind: 'secret', user }), validationTimeout)
  })

  describe(`with user ${usr1} (configmap in namespace ${ns} only)`, () => {
    beforeAll(() => {
      user = buildUserObject(usr1)
    })

    test('should validate RBAC configuration for user', () => {
      expect(() => execSync(`oc auth can-i list secret -n ${ns} --as=${user.fullName}`)).toThrow()
      expect(() => execSync(`oc auth can-i list configmap -n ${ns} --as=${user.fullName}`)).not.toThrow()
    })

    test('should not receive Secret', () => ValidateSearchData({ kind: 'secret', user }, validationTimeout))
    test('should receive ConfigMap', () => ValidateSearchData({ kind: 'configmap', user }), validationTimeout)
  })

  describe(`with user ${usr2} (nodes and configmap in all namespaces.)`, () => {
    beforeAll(() => {
      user = buildUserObject(usr2)
    })

    test('should validate RBAC configuration for user', () => {
      expect(() => execSync(`oc auth can-i list secret -n ${ns} --as=${user.fullName}`)).toThrow()
      expect(() => execSync(`oc auth can-i list configmap -A --as=${user.fullName}`)).not.toThrow()
      expect(() => execSync(`oc auth can-i list configmap -n ${ns} --as=${user.fullName}`)).not.toThrow()
      expect(() => execSync(`oc auth can-i list node --as=${user.fullName}`)).not.toThrow()
    })

    test('should not receive Secret', () => ValidateSearchData({ kind: 'secret', user }, validationTimeout))

    // TODO: Investigate why this fails and enable.
    test.skip('should receive ConfigMap', () => ValidateSearchData({ kind: 'configmap', user }), validationTimeout)
    // TODO: Need to update the CLI parsing function.
    test.skip('should receive Node', () => ValidateSearchData({ kind: 'node', user }), validationTimeout)
  })

  describe(`with user ${usr3} (all resources in namespace ${ns})`, () => {
    test.todo('should validate RBAC configuration.')
    test.todo('should validate results from search.')
  })

  describe(`with user search-user4 (access to deployment but not pod)`, () => {
    test.todo('should validate RBAC configuration.')
    test.todo('should validate relationship data is correct.')
  })

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
