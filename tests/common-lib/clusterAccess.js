// Copyright (c) 2020 Red Hat, Inc.

const config = require('../../config')
const { sleep } = require('./sleep')
const { execSync } = require('child_process')
const request = require('supertest')
const fs = require('fs')

// Login to the cluster
const clusterLogin = () => {
  if (!process.env.USE_HUB_KUBECONFIG) {
    execSync(
      `oc login -u ${config.get('options:hub:user')} -p ${config.get('options:hub:password')} --server=https://api.${config.get('options:hub:baseDomain')}:6443 --insecure-skip-tls-verify`
    )
  } else {
    execSync(
      `oc config use-context --kubeconfig=${process.env.OPTIONS_HUB_KUBECONFIG} ${process.env.OPTIONS_HUB_KUBECONTEXT}`
    )
  }
}

// Login and get access token
const getToken = () => {
  clusterLogin()
  return execSync('oc whoami -t').toString().replace('\n', '')
}

// Check if the route to Search API exist and create a new route if needed.
const getSearchApiRoute = async () => {
  const namespace = execSync(
    `oc get mch -A -o jsonpath='{.items[0].metadata.namespace}'`
  ).toString()
  const routes = execSync(`oc get routes -n ${namespace}`).toString()

  if (routes.indexOf('search-api-automation') == -1) {
    execSync(
      `oc create route passthrough search-api-automation --service=search-search-api --insecure-policy=Redirect -n ${namespace}`
    )
    await sleep(10000)
  }
  return `https://search-api-automation-${namespace}.apps.${config.get(
    'options:hub:baseDomain'
  )}`
}

const getKubeConfig = () => {
  const kubeconfigs = []
  const dir = './kube/config'
  fs.readdirSync(dir).forEach((file) => {
    if (file[0] !== '.') {
      kubeconfigs.push(`${dir}/${file}`)
    }
  })
  return kubeconfigs
}

function searchQueryBuilder({ keywords = [], filters = [], limit = 1000 }) {
  // Return query built from passed arguments.
  const query = {
    operationName: 'searchResult',
    variables: {
      input: [
        {
          keywords: keywords,
          filters: filters,
          limit: limit,
        },
      ],
    },
    query:
      'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n    __typename\n  }\n}\n',
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

function getPods(ns) {
  var stdout = execSync(`oc get pods -n ${ns} --no-headers`).toString()
  const pods = stdout.split('\n').map((pod) => pod.split(/ +/))
  const filteredPods = pods.filter((item) => {
    return item[0] !== undefined
  })

  if (filteredPods[0] !== undefined) {
    return filteredPods
  }
}

async function deletePod(pod, ns) {
  execSync(`oc delete pod ${pod} -n ${ns} --wait=true`)
}

exports.clusterLogin = clusterLogin
exports.getToken = getToken
exports.getSearchApiRoute = getSearchApiRoute
exports.getKubeConfig = getKubeConfig
exports.searchQueryBuilder = searchQueryBuilder
exports.sendRequest = sendRequest
exports.getPods = getPods
exports.deletePod = deletePod
