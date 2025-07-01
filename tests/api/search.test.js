// Copyright Contributors to the Open Cluster Management project

// Configure Jest retries and options.
jest.retryTimes(globalThis.retry, globalThis.retryOptions)

const { execSync } = require('child_process')

const squad = require('../../config').get('squadName')
const { getKubeConfig, getSearchApiRoute, getKubeadminToken } = require('../common-lib/clusterAccess')
const { searchQueryBuilder, sendRequest } = require('../common-lib/searchClient')

describe('RHACM4K-913: Search API - Verify search results with different queries', () => {
  // Get kubeconfig for imported clusters
  var kubeconfigs = getKubeConfig()

  // Get managed cluster
  var import_kubeconfig = kubeconfigs.find((k) => k.includes('import'))

  beforeAll(async () => {
    // Log in and get access token
    token = getKubeadminToken()

    // Create a route to access the Search API.
    searchApiRoute = await getSearchApiRoute()

    if (import_kubeconfig) {
      managedCluster = execSync(
        `oc --kubeconfig ${import_kubeconfig} get klusterlets.operator.open-cluster-management.io -o custom-columns=NAME:.spec.clusterName --no-headers`
      )
        .toString()
        .trim()
    } else {
      console.log('Cannot get managedCluster because import_kubeconfig is undefined.')
    }
  })

  // Skipping this test because it fails intermittently, which creates unreliable results.
  test.skip(`[P3][Sev3][${squad}] should have expected count of pods in ocm on hub cluster.`, async () => {
    var query = searchQueryBuilder({
      filters: [
        { property: 'kind', values: ['Pod'] },
        { property: 'namespace', values: ['open-cluster-management'] },
        { property: 'status', values: ['Running'] },
        { property: 'cluster', values: ['local-cluster'] },
      ],
    })
    const [searchRes, cliRes] = await Promise.all([
      sendRequest(query, token),
      execSync('oc get pods -n open-cluster-management --field-selector=status.phase==Running --no-headers | wc -l'),
    ])
    const pods = searchRes.body.data.searchResult[0].items
    expect(pods.length.toString()).toEqual(cliRes.toString().trim())
  }, 10000)

  // Skipping this test because it fails intermittently, which creates unreliable results.
  test.skip(`[P3][Sev3][${squad}] should have expected count of pods in ocm-agent on hub cluster.`, async () => {
    var query = searchQueryBuilder({
      filters: [
        { property: 'kind', values: ['Pod'] },
        { property: 'namespace', values: ['open-cluster-management-agent'] },
        { property: 'status', values: ['Running'] },
        { property: 'cluster', values: ['local-cluster'] },
      ],
    })
    const [searchRes, cliRes] = await Promise.all([
      sendRequest(query, token),
      execSync(
        'oc get pods -n open-cluster-management-agent --field-selector=status.phase==Running --no-headers | wc -l'
      ),
    ])
    const pods = searchRes.body.data.searchResult[0].items
    expect(pods.length.toString()).toEqual(cliRes.toString().trim())
  }, 10000)

  test(`[P3][Sev3][${squad}] should have expected count of pods in ocm-agent on imported cluster.`, async () => {
    if (import_kubeconfig) {
      var query = searchQueryBuilder({
        filters: [
          { property: 'kind', values: ['Pod'] },
          { property: 'namespace', values: ['open-cluster-management-agent'] },
          { property: 'status', values: ['Running'] },
          { property: 'cluster', values: [managedCluster] },
        ],
      })
      const [searchRes, cliRes] = await Promise.all([
        sendRequest(query, token),
        execSync(
          `oc --kubeconfig ${import_kubeconfig} get pods -n open-cluster-management-agent --field-selector=status.phase==Running --no-headers | wc -l`
        ),
      ])
      const pods = searchRes.body.data.searchResult[0].items
      expect(pods.length.toString()).toEqual(cliRes.toString().trim())
    } else {
      console.log('Test skipped because import_kubeconfig is undefined.')
    }
  }, 10000)

  // Skipping this test because it fails intermittently, which creates unreliable results.
  test.skip(`[P3][Sev3][${squad}] should have expected count of pods in ocm-agent-addon on hub cluster.`, async () => {
    var query = searchQueryBuilder({
      filters: [
        { property: 'kind', values: ['Pod'] },
        { property: 'namespace', values: ['open-cluster-management-agent-addon'] },
        { property: 'status', values: ['Running'] },
        { property: 'cluster', values: ['local-cluster'] },
      ],
    })
    const [searchRes, cliRes] = await Promise.all([
      sendRequest(query, token),
      execSync(
        'oc get pods -n open-cluster-management-agent-addon --field-selector=status.phase==Running --no-headers | wc -l'
      ),
    ])
    const pods = searchRes.body.data.searchResult[0].items
    expect(pods.length.toString()).toEqual(cliRes.toString().trim())
  }, 10000)

  test.skip(`[P3][Sev3][${squad}] should have expected count of pods in ocm-agent-addon on imported cluster.`, async () => {
    if (import_kubeconfig) {
      var query = searchQueryBuilder({
        filters: [
          { property: 'kind', values: ['Pod'] },
          { property: 'namespace', values: ['open-cluster-management-agent-addon'] },
          { property: 'status', values: ['Running'] },
          { property: 'cluster', values: [managedCluster] },
        ],
      })
      const [searchRes, cliRes] = await Promise.all([
        sendRequest(query, token),
        execSync(
          `oc --kubeconfig ${import_kubeconfig} get pods -n open-cluster-management-agent-addon --field-selector=status.phase==Running --no-headers | wc -l`
        ),
      ])
      const pods = searchRes.body.data.searchResult[0].items
      expect(pods.length.toString()).toEqual(cliRes.toString().trim())
    } else {
      console.log('Test skipped because import_kubeconfig is undefined.')
    }
  }, 10000)

  test(`[P3][Sev3][${squad}] should have expected count of pods in kube-system on imported cluster.`, async () => {
    if (import_kubeconfig) {
      var query = searchQueryBuilder({
        filters: [
          { property: 'kind', values: ['Pod'] },
          { property: 'namespace', values: ['kube-system'] },
          { property: 'status', values: ['Running'] },
          { property: 'cluster', values: [managedCluster] },
        ],
      })
      const [searchRes, cliRes] = await Promise.all([
        sendRequest(query, token),
        execSync(
          `oc --kubeconfig ${import_kubeconfig} get pods -n kube-system --field-selector=status.phase==Running --no-headers | wc -l`
        ),
      ])
      const pods = searchRes.body.data.searchResult[0].items
      expect(pods.length.toString()).toEqual(cliRes.toString().trim())
    } else {
      console.log('Test skipped because import_kubeconfig is undefined.')
    }
  }, 10000)
})
