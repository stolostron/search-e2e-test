// Copyright Contributors to the Open Cluster Management project

jest.retryTimes(global.retry)

const squad = require('../../config').get('squadName')
const { getSearchApiRoute } = require('../common-lib/clusterAccess')
const { ValidateSearchData } = require('../common-lib/validateSearchData')
const { execSync } = require('child_process')
const { sleep } = require('../common-lib/sleep')

describe('Search API: Verify RBAC', () => {
    beforeAll(async () => {
        // Configure users (serviceaccounts) for the tests.

        let testId = 'rbac-test-0'
        execSync(`oc new-project ${testId}`)
        execSync(`oc create serviceaccount ${testId} -n ${testId}`)
        
        /*
        export testId=automation-test1
        oc new-project ${testId}
        oc create serviceaccount ${testId}
        oc create role ${testId} --verb=get,list --resource=pods,configmaps
        oc create rolebinding ${testId} --role=${testId} --serviceaccount=${testId}:${testId}
        oc create clusterrole ${testId} --verb=list,get --resource=nodes
        oc create clusterrolebinding ${testId} --clusterrole=${testId} --serviceaccount=${testId}:${testId}
        */
        testId = 'rbac-test-1'
        execSync(`oc new-project ${testId}`)
        execSync(`oc create serviceaccount ${testId} -n ${testId}`)
        execSync(`oc create role ${testId} --verb=get,list --resource=pods,configmaps -n ${testId}`)
        execSync(`oc create rolebinding ${testId} --role=${testId} --serviceaccount=${testId}:${testId} -n ${testId}`)
        execSync(`oc create clusterrole ${testId} --verb=list,get --resource=nodes -n ${testId}`)        
        execSync(`oc create clusterrolebinding ${testId} --clusterrole=${testId} --serviceaccount=${testId}:${testId} -n ${testId}`)

        // Create a route to access the Search API.
        searchApiRoute = await getSearchApiRoute()

        // Wait for config to be updated. Will need a more efficient solution to avoid sleep in the future.
        await sleep(30000)
      }, 35000)
      afterAll(()=>{
        execSync('oc delete ns rbac-test-0')
        execSync('oc delete ns rbac-test-1')
        execSync('oc delete clusterrolebinding rbac-test-1')
        execSync('oc delete clusterrole rbac-test-1')
      }, 20000)

      describe(`user rbac-test-0 (not authorized to list any resources) `, () => {
        beforeAll(async () => {
            // $ oc serviceaccounts get-token ${testId}
            userToken = execSync('oc serviceaccounts get-token rbac-test-0 -n rbac-test-0')
        })

        test('validate kubernetes configuration for user', async() => {
            // oc auth can-i list pod --as=system:serviceaccount:${testId}:${testId}
            expect(execSync('oc auth can-i list pod -n rbac-test-0 --as=system:serviceaccount:rbac-test-0:rbac-test-0')).toContain('no')
            expect(execSync('oc auth can-i list node --as=system:serviceaccount:rbac-test-0:rbac-test-0')).toContain('no')
        })

        test('validate access to Secrets', async () =>{
            ValidateSearchData("Secret", '') // FIXME: pass user token!
        })
        test("validate access to Pods", async () =>{
            ValidateSearchData("Pod", '') // FIXME: pass user token!
        })
        test("validate access to Nodes", async () =>{
            ValidateSearchData("Node", "") // FIXME: pass user token!
        })
    })


    describe(`user rbac-test-1 `, () => {
        beforeAll(async () => {
            // $ oc serviceaccounts get-token ${testId}
            userToken = execSync('oc serviceaccounts get-token rbac-test-1 -n rbac-test-1')
        })

        test('validate access to Secrets', async () =>{
            ValidateSearchData("Secret", '') // FIXME: pass user token!
        })
        test("validate access to Pods", async () =>{
            ValidateSearchData("Pod", '') // FIXME: pass user token!
        })
        test("validate access to Nodes", async () =>{
            ValidateSearchData("Node", "") // FIXME: pass user token!
        })
    })
})