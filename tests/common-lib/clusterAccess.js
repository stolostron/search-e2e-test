// Copyright (c) 2020 Red Hat, Inc.

const config = require('../../config')
const { execSync } = require('child_process');


// Login to the cluster
const clusterLogin = () => {
    execSync(`oc login -u ${config.get('options:hub:user')} -p ${config.get('options:hub:password')} --server=https://api.${config.get('options:hub:baseDomain')}:6443`)
}

// Login and get access token
const getToken = () => {
    clusterLogin()
    return execSync('oc whoami -t').toString().replace('\n', '')
}

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
        await sleep(1000)
    }
    searchApiRoute = `https://search-api-automation-open-cluster-management.apps.${config.get('options:hub:baseDomain')}`
    return searchApiRoute
}


exports.clusterLogin = clusterLogin
exports.getToken = getToken
exports.getSearchApiRoute = getSearchApiRoute