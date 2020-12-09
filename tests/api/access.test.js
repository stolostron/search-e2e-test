// Copyright (c) 2020 Red Hat, Inc.

const { getSearchApiRoute, getToken, getManagedClusterName } = require('../common-lib/clusterAccess')
const request = require('supertest');
const config = require('../../config');
const queries = require('../common-lib/queries.json')

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

describe('Search: Verify access to the search-api', () => {

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

    test('Should get 401 if authorization header is not present.', ()=>{ 
        return request(searchApiRoute)
            .post('/searchapi/graphql')
            .send(query)
            .expect(401)
    })

    test('Should get 401 if authorization header is incorrect.', ()=>{
        return request(searchApiRoute)
            .post('/searchapi/graphql')
            .send(query)
            .set({ Authorization: 'Bearer invalidauthorizationtoken' })
            .expect(401)
    })

    test('Search for kind:pod should return results.', ()=>{
        return request(searchApiRoute)
            .post('/searchapi/graphql')
            .send(query)
            .set({ Authorization: `Bearer ${token}` })
            .expect(200)
    }, 20000) // Timeout is high at 20 seconds because first search takes longer to build the rbac filter cache.

})

describe('RHACM4K-912 - Search - verify managed cluster info in the search page', () => {

    beforeAll(async () => {
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

    test.only('RHACM4K-912 - Search - verify managed cluster info in the search page.', async () => {
        const res = await request(searchApiRoute)
            .post('/searchapi/graphql')
            .send(queries.managedClusterJoined)
            .set({ Authorization: `Bearer ${token}` })
            .expect(200)
        expect(res.body.data.searchResult[0].items[0].ManagedClusterJoined).toEqual("True")
        expect(res.body.data.searchResult[0].items[0].status).toEqual("OK")

        const res1 = await request(searchApiRoute)
            .post('/searchapi/graphql')
            .send(queries.cluster)
            .set({ Authorization: `Bearer ${token}` })
            .expect(200)
        expect(res1.body.data.searchResult[0].items[0].kind).toEqual("cluster")
        expect(res1.body.data.searchResult[0].items[0].name).toEqual("local-cluster")

        const res2 = await request(searchApiRoute)
            .post('/searchapi/graphql')
            .send(queries.pod)
            .set({ Authorization: `Bearer ${token}` })
            .expect(200)
        expect(res2.body.data.searchResult[0].items[0].kind).toEqual("pod")

        const res3 = await request(searchApiRoute)
            .post('/searchapi/graphql')
            .send(queries.managedClusterAgents)
            .set({ Authorization: `Bearer ${token}` })
            .expect(200)
        
        var pods = res3.body.data.searchResult[0].items
        pods.forEach(element => {
            expect(element.status).toEqual("Running")
        });
        }, 20000)
})
