// Copyright (c) 2020 Red Hat, Inc.

const { getSearchApiRoute, getToken } = require('../common-lib/clusterAccess')
const request = require('supertest');

var searchApiRoute = ''
var token = ''

const query = {
    operationName: 'searchResult',
    variables: {
        input: [{ 
            keywords: [],
            filters: [{property: 'kind', values:['pod']}],
            limit: 1000
        }]
    },
    query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n    __typename\n  }\n}\n'
}

describe('Search API: [P1][Sev1][search] Verify access:', () => {

    beforeAll(async() => {
        // Log in and get access token
        token = getToken()
        
        // Create a route to access the Search API.
        searchApiRoute = await getSearchApiRoute()

        // Temporary workaround. TODO: Get SSL cert from cluster.
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
    })

    // Cleanup and teardown here.
    afterAll(() => {
    })

    test('should get 401 if authorization header is not present.', ()=>{ 
        return request(searchApiRoute)
            .post('/searchapi/graphql')
            .send(query)
            .expect(401)
    })

    test('should get 401 if authorization header is incorrect.', ()=>{
        return request(searchApiRoute)
            .post('/searchapi/graphql')
            .send(query)
            .set({ Authorization: 'Bearer invalidauthorizationtoken' })
            .expect(401)
    })

    test('should return results when searching for kind:pod.', ()=>{
        return request(searchApiRoute)
            .post('/searchapi/graphql')
            .send(query)
            .set({ Authorization: `Bearer ${token}` })
            .expect(200)
    }, 20000) // Timeout is high at 20 seconds because first search takes longer to build the rbac filter cache.

})