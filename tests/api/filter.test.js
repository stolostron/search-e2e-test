// Copyright (c) 2020 Red Hat, Inc.

jest.retryTimes(global.retry)

const { execSync } = require('child_process')

const squad = require('../../config').get('squadName')
const {
  getSearchApiRoute,
  getToken,
} = require('../common-lib/clusterAccess')
const { searchQueryBuilder, sendRequest } = require('../common-lib/searchClient')

describe('RHACM4K-1709: Search - Search using filters', () => {
  beforeAll(async () => {
    // Log in and get access token
    token = getToken()

    // Create a route to access the Search API.
    searchApiRoute = await getSearchApiRoute()

    // Temporary workaround. TODO: Get SSL cert from cluster.
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
  })

  var filtersRegistry = [
    { filters: [{ property: 'created', values: ['month'] }] },
    { filters: [{ property: 'apigroup', values: ['apps'] }] },
    { filters: [{ property: 'desired', values: ['=0'] }] },
    { filters: [{ property: 'current', values: ['=0'] }] },
    { filters: [{ property: 'ready', values: ['=0'] }] },
    { filters: [{ property: 'available', values: ['=0'] }] },
    { filters: [{ property: 'restarts', values: ['=0'] }] },
    { filters: [{ property: 'parallelism', values: ['=1'] }] },
    { filters: [{ property: 'completions', values: ['=1'] }] },
    { filters: [{ property: 'successful', values: ['=1'] }] },
    { filters: [{ property: 'updated', values: ['>0'] }] },
    { filters: [{ property: 'cpu', values: ['>0'] }] },
    { filters: [{ property: 'active', values: ['=0'] }] },
    { filters: [{ property: 'nodes', values: ['>0'] }] },
    { filters: [{ property: 'apiversion', values: ['v1'] }] },
    { filters: [{ property: 'container', values: ['acm-agent'] }] },
    {
      filters: [
        {
          property: 'podIP',
          values: [
            execSync(
              "oc get pods -n openshift-console -o=jsonpath='{.items[0].status.podIP}'"
            ).toString(),
          ],
        },
      ],
    },
    {
      filters: [
        {
          property: 'hostIP',
          values: [
            execSync(
              "oc get pods -n openshift-console -o=jsonpath='{.items[0].status.hostIP}'"
            ).toString(),
          ],
        },
      ],
    },
    {
      filters: [
        {
          property: 'kubernetesVersion',
          values: [
            execSync(
              "oc get nodes -o=jsonpath='{.items[0].status.nodeInfo.kubeletVersion}'"
            ).toString(),
          ],
        },
      ],
    },
    {
      filters: [
        {
          property: 'memory',
          values: [
            execSync(
              "oc get managedclusters -o=jsonpath='{.items[0].status.capacity.memory}'"
            ).toString(),
          ],
        },
      ],
    },
    { filters: [{ property: 'startedAt', values: ['month'] }] },
    { filters: [{ property: 'cluster', values: ['local-cluster'] }] },
    { filters: [{ property: 'port', values: ['8443/TCP'] }] },
    { filters: [{ property: 'type', values: ['ClusterIP'] }] },
    {
      filters: [
        {
          property: 'capacity',
          values: [
            execSync(
              "oc get pv -o=jsonpath='{.items[0].spec.capacity.storage}'"
            ).toString(),
          ],
        },
      ],
    },
    {
      filters: [
        {
          property: 'clusterIP',
          values: [
            execSync(
              "oc get service -o=jsonpath='{.items[0].spec.clusterIP}'"
            ).toString(),
          ],
        },
      ],
    },
    { filters: [{ property: 'lastSchedule', values: ['month'] }] },
    { filters: [{ property: 'suspend', values: ['false'] }] },
    {
      filters: [
        {
          property: 'request',
          values: [
            execSync(
              "oc get pv -o=jsonpath='{.items[0].spec.capacity.storage}'"
            ).toString(),
          ],
        },
      ],
    },
    {
      filters: [
        {
          property: 'volumeName',
          values: [
            execSync(
              "oc get pv -o=jsonpath='{.items[0].metadata.name}'"
            ).toString(),
          ],
        },
      ],
    },
    {
      filters: [
        {
          property: 'architecture',
          values: [
            execSync(
              "oc get nodes -o=jsonpath='{.items[0].status.nodeInfo.architecture}'"
            ).toString(),
          ],
        },
      ],
    },
    {
      filters: [
        {
          property: 'osImage',
          values: [
            execSync(
              "oc get nodes -o=jsonpath='{.items[0].status.nodeInfo.osImage}'"
            ).toString(),
          ],
        },
      ],
    },
    {
      filters: [
        {
          property: 'claimRef',
          values: [
            execSync(
              'oc get pv -o=jsonpath=\'{range .items[0]}{.spec.claimRef.namespace}{"/"}{.spec.claimRef.name}{end}\''
            ).toString(),
          ],
        },
      ],
    },
    {
      filters: [
        {
          property: 'reclaimPolicy',
          values: [
            execSync(
              "oc get pv -o=jsonpath='{.items[0].spec.persistentVolumeReclaimPolicy}'"
            ).toString(),
          ],
        },
      ],
    },
    {
      filters: [
        {
          property: 'consoleURL',
          values: [execSync('oc whoami --show-console').toString()],
        },
      ],
    },
  ]

  filtersRegistry.forEach((value) => {
    test(`[P2][Sev2][${squad}] should filter by ${value.filters[0].property}`, async () => {
      var query = searchQueryBuilder(value)
      var res = await sendRequest(query, token)
    }, 20000)
  })
})
