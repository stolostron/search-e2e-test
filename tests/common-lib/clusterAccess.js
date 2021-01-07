// Copyright (c) 2020 Red Hat, Inc.

const config = require('../../config')
const { sleep } = require('./sleep')
const { execSync } = require('child_process');
const request = require('supertest');
const { mainModule } = require('process');

// Login to the cluster
const clusterLogin = () => {
    execSync(`oc login -u ${config.get('options:hub:user')} -p ${config.get('options:hub:password')} --server=https://api.${config.get('options:hub:baseDomain')}:6443`)
}

// Login and get access token
const getToken = () => {
    clusterLogin()
    return execSync('oc whoami -t').toString().replace('\n', '')
}

// Squad name for tests metadata label.
const squad = "search"   

// Create a route to access the Search API.
var searchApiRoute = '' // Used like a cache to avoid requesting the route multiple times.
const getSearchApiRoute = async ()  => {
    if (searchApiRoute != '') {
        return searchApiRoute
    }

    // Check if the route exist and create a new route if needed.
    var routes = execSync(`oc get routes -n open-cluster-management`).toString()
    if (routes.indexOf('search-api-automation') == -1){
        execSync(`oc create route passthrough search-api-automation --service=search-search-api --insecure-policy=Redirect -n open-cluster-management`)
        await sleep(10000)
    }
    searchApiRoute = `https://search-api-automation-open-cluster-management.apps.${config.get('options:hub:baseDomain')}`
    return searchApiRoute
}

function searchQueryBuilder({ keywords = [], filters = [], limit = 1000}) {
    // Return query built from passed arguments.
    const query = {
        operationName: 'searchResult',
            variables: {
            input: [{
                keywords: keywords,
                filters: filters,
                limit: limit
            }]
        },
        query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n    __typename\n  }\n}\n'
    }
    return query
}

function sendRequest(query, token) {
    return request(searchApiRoute)
        .post('/searchapi/graphql')
        .send(query)
        .set({ Authorization: `Bearer ${token}` })
        .expect(200)
}

function getPods (ns) {
    var stdout = execSync(`oc get pods -n ${ns} --no-headers`).toString()
    const pods = stdout.split('\n').map(pod => pod.split(/ +/))
    const filteredPods = pods.filter((item) => {
        return (
            item[0] !== undefined
        )
        })

    if (filteredPods[0] !== undefined) {
        return filteredPods
    }
  }

async function deletePod (pod, ns) {
    execSync(`oc delete pod ${pod} -n ${ns}`)
    await sleep(20000)
}

exports.clusterLogin = clusterLogin
exports.getToken = getToken
exports.getSearchApiRoute = getSearchApiRoute
exports.searchQueryBuilder = searchQueryBuilder
exports.sendRequest = sendRequest
exports.squad = squad
exports.getPods = getPods
exports.deletePod = deletePod
