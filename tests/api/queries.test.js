// Copyright Contributors to the Open Cluster Management project

jest.retryTimes(global.retry)

const { execSync } = require('child_process')
const squad = require('../../config').get('squadName')
const { getSearchApiRoute, getToken } = require('../common-lib/clusterAccess')
// const { searchQueryBuilder, sendRequest } = require('../common-lib/searchClient')

const usr = 'search-query-user'
const ns = 'search-query'
describe('Search API - Verify results of different queries', () => {
  beforeAll(async () => {
    // Avoid using kubeadmin to get these benefits.
    // - Factor RBAC testing in all scenarios.
    // - Filter out other resources in the cluster that could affect the expected results.

    /*
        export ns=search-query
        export usr=search-query-usr
        oc new-project ${ns}
        oc create serviceaccount ${usr}

        oc create configmap cm0 -n ${ns} --from-literal=key=cm0
        oc create configmap cm1 -n ${ns} --from-literal=key=cm1
        */

    const createUsersAndResources = async () => {
      execSync(`oc new-project ${ns}`) // TODO: this is changing ns when running locally.
      execSync(`oc create serviceaccount ${usr} -n ${ns}`)

      execSync(`oc create configmap search-cm0 -n ${ns} --from-literal=key=cm0`)
      execSync(`oc create configmap search-cm1 -n ${ns} --from-literal=key=cm1`)
    }

    // Run the setup steps in parallel
    // - Create a route to access the Search API.
    // - Create user and resources for this test.
    const [route] = await Promise.all([getSearchApiRoute(), createUsersAndResources()])
    searchApiRoute = route

    user = {
      fullName: `system:serviceaccount:${ns}:${usr}`,
      name: usr,
      namespace: ns,
      token: execSync(`oc serviceaccounts get-token ${usr} -n ${ns}`),
    }
  }, 20000)

  describe(`[${squad}] search using keywords`, () => {
    test.todo('should only match resources containing the keyword.')
    test.todo('shouls match resources with text containing abc OR xyz')
  })

  describe(`[${squad}] search using labels`, () => {
    test.todo('should only match resources containing the label.')
    test.todo('should only match resources containing labelA OR labelB.')
  })

  describe(`[${squad}] search using kind`, () => {
    test.todo('should be case sensitive.')
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
