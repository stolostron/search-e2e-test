// Copyright Contributors to the Open Cluster Management project

jest.retryTimes(global.retry)

const squad = require('../../config').get('squadName')
const { getSearchApiRoute } = require('../common-lib/clusterAccess')
const { ValidateSearchData, validationTimeout } = require('../common-lib/validateSearchData')
const { execSync } = require('child_process')

describe('Search API: Verify RBAC', () => {
  const ns = 'search-rbac'
  const usr = 'search-user1'
  beforeAll(async () => {
    // Configure ServiceAccounts (users) for the tests.
    // ServiceAccounts are simpler because it doesn't require an IDP.

    /*
        export usr=search-user1
        export ns=search-rbac
        oc new-project ${ns}
        oc create serviceaccount ${usr}
        oc create role ${usr} --verb=get,list --resource=pods,configmaps
        oc create rolebinding ${usr} --role=${usr} --serviceaccount=${ns}:${usr}
        oc create clusterrole ${usr} --verb=list,get --resource=nodes
        oc create clusterrolebinding ${usr} --clusterrole=${usr} --serviceaccount=${ns}:${usr}
        oc create configmap cm0 -n ${ns} --from-literal=key=cm0
        oc create configmap cm1 -n ${ns} --from-literal=key=cm1
        */
    const asyncSetup = async () => {
      // const start = Date.now()
      execSync(`oc new-project ${ns}`)
      execSync(`oc create serviceaccount search-user0 -n ${ns}`)
      execSync(`oc create serviceaccount ${usr} -n ${ns}`)
      execSync(`oc create role ${usr} --verb=get,list --resource=pods,configmaps -n ${ns}`)
      execSync(`oc create rolebinding ${usr} --role=${usr} --serviceaccount=${ns}:${usr} -n ${ns}`)
      execSync(`oc create clusterrole ${usr} --verb=list,get --resource=nodes -n ${ns}`)
      execSync(`oc create clusterrolebinding ${usr} --clusterrole=${usr} --serviceaccount=${ns}:${usr} -n ${ns}`)
      execSync(`oc create configmap search-cm0 -n ${ns} --from-literal=key=cm0`)
      execSync(`oc create configmap search-cm1 -n ${ns} --from-literal=key=cm1`)
      // console.log(`RBAC setup took: ${Date.now() - start} ms.`)
    }

    const [route] = await Promise.all([getSearchApiRoute(), asyncSetup()])

    // Create a route to access the Search API.
    searchApiRoute = route //await getSearchApiRoute()
  }, 20000)

  afterAll(async () => {
    execSync(`oc delete ns ${ns}`)
    execSync(`oc delete clusterrolebinding ${usr}`)
    execSync(`oc delete clusterrole ${usr}`)
  }, 20000)

  describe(`with user search-user0 (not authorized to list any resources) `, () => {
    beforeAll(() => {
      userToken = execSync(`oc serviceaccounts get-token search-user0 -n ${ns}`)
    })

    test('should validate RBAC configuration for user', () => {
      expect(() => {
        execSync(`oc auth can-i list secret --as=system:serviceaccount:${ns}:search-user0`)
      }).toThrow('Command failed:')

      expect(() => {
        execSync(`oc auth can-i list node --as=system:serviceaccount:${ns}:search-user0`)
      }).toThrow('Command failed:')
    })

    test(
      'validate access to Secret',
      async () => {
        return ValidateSearchData({ kind: 'secret', user: { name: 'search-user0', namespace: ns, token: userToken } })
      },
      validationTimeout
    )
    test(
      'validate access to ConfigMap',
      async () => {
        return ValidateSearchData({
          kind: 'configmap',
          user: { name: 'search-user0', namespace: ns, token: userToken },
        })
      },
      validationTimeout
    )
    test(
      'validate access to Node',
      async () => {
        return ValidateSearchData({ kind: 'node', user: { name: 'search-user0', namespace: ns, token: userToken } })
      },
      validationTimeout
    )
  })

  describe('with user search-user1 ', () => {
    beforeAll(async () => {
      userToken = execSync(`oc serviceaccounts get-token ${usr} -n ${ns}`)
    })

    test('should validate RBAC configuration for user', async () => {
      expect(() => {
        execSync(`oc auth can-i list secret -n ${ns} --as=system:serviceaccount:${ns}:${usr}`)
      }).toThrow('Command failed:')
      expect(() => {
        execSync(`oc auth can-i list configmap -n ${ns} --as=system:serviceaccount:${ns}:${usr}`)
      }).not.toThrow('Command failed:')
      expect(() => {
        execSync(`oc auth can-i list node --as=system:serviceaccount:${ns}:${usr}`)
      }).not.toThrow('Command failed:')
    })

    test(
      'validate access to Secrets',
      async () => {
        return ValidateSearchData({ kind: 'secret', user: { name: usr, namespace: ns, token: userToken } })
      },
      validationTimeout
    )
    test(
      'validate access to ConfigMaps',
      async () => {
        return ValidateSearchData({ kind: 'configmap', user: { name: usr, namespace: ns, token: userToken } })
      },
      validationTimeout
    )

    // TODO: Need to update the CLI parsing function.
    test.skip(
      'validate access to Nodes',
      async () => {
        return ValidateSearchData({ kind: 'node', user: { name: usr, namespace: ns, token: userToken } })
      },
      validationTimeout
    )
  })

  describe(`with user search-user2 (authorized to access namespace ${ns} only.)`, () => {
    test.todo('should validate RBAC configuration.')
    test.todo('should validate results from search.')
  })
})
