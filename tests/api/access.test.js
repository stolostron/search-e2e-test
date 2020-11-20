// Copyright (c) 2020 Red Hat, Inc.

import { clusterLogin, getToken } from '../../config'
const request = require('supertest');
const config = require('../../config');
const { execSync } = require('child_process');


const searchApiRoute = `https://search-api-tests-open-cluster-management.apps.${config.get('options:hub:baseDomain')}`
var token = ''

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

describe('Verify access to the search-api', () => {

    beforeAll(async() => {

        // Get bearer token
        clusterLogin()
        token = getToken()
        // execSync(`oc login -u ${config.get('options:hub:user')} -p ${config.get('options:hub:password')} --server=https://api.${config.get('options:hub:baseDomain')}:6443`)
        // token = execSync('oc whoami -t').toString().replace('\n', '')
        
        // Create search-api-test route if it doesn't exist
        var routes = execSync(`oc get routes -n open-cluster-management`).toString()
        if (routes.indexOf('search-api-tests') == -1){
            execSync(`oc create route passthrough search-api-tests --service=search-search-api --insecure-policy=Redirect -n open-cluster-management`)
            await sleep(1000)
        }


        // TODO: Get SSL cert from cluster.
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0 // Temporary workaround.
    })

    afterAll(() => {
        // Cleanup and teardown here.
    })

    const query = {
        operationName: 'searchResult',
        variables: {
            input: [{ 
                keywords: [],
                filters: [{property: 'kind', values:['pod']}],
                limit: 10000
            }]
        },
        query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n    __typename\n  }\n}\n'
    }


    test('Search: Should get 401 if authorization header is not present.', ()=>{ 
        return request(searchApiRoute)
            .post('/searchapi/graphql')
            .send(query)
            .expect(401);
    })

    test('Search: Should get 401 if authorization header is incorrect.', ()=>{
        return request(searchApiRoute)
            .post('/searchapi/graphql')
            .send(query)
            .set({ Authorization: 'Bearer invalidauthorizationtoken' })
            .expect(401);
    })

    test('Search: Search for kind:pod should return results.', ()=>{
        return request(searchApiRoute)
            .post('/searchapi/graphql')
            .send(query)
            .set({ Authorization: `Bearer ${token}` })
            .expect(200);
    }, 20000) // Timeout is high at 20 seconds because first search takes longer to build the rbac filter cache.

})