// Copyright (c) 2020 Red Hat, Inc.

const { getSearchApiRoute, getToken } = require('../common-lib/clusterAccess')
const request = require('supertest');
const config = require('../../config');
const { execSync } = require('child_process');


var searchApiRoute = ''
var token = ''

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

describe('Verify access to the search-api', () => {

    beforeAll(async() => {
        // Log in and get access token
        token = getToken()
        
        // Create a route to access the Search API.
        searchApiRoute = getSearchApiRoute()

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