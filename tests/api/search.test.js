// Copyright (c) 2020 Red Hat, Inc.

const squad = require('../../config').get('squadName')
const {
  getSearchApiRoute,
  getToken,
  getKubeConfig,
  searchQueryBuilder,
  sendRequest,
} = require('../common-lib/clusterAccess')
const { exec, execSync } = require('child_process')

jest.retryTimes(3);
describe('RHACM4K-913: Search - Verify search results with different queries', () => {
  // Get kubeconfig for imported clusters
  var kubeconfigs = getKubeConfig()

  // Get managed cluster
  var import_kubeconfig = kubeconfigs.find((k) => k.includes('import'))

  beforeAll(async () => {
    // Log in and get access token
    token = getToken()

    // Create a route to access the Search API.
    searchApiRoute = await getSearchApiRoute()

    // Temporary workaround. TODO: Get SSL cert from cluster.
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0

    if (import_kubeconfig) {
      managedCluster = execSync(
        `oc --kubeconfig ${import_kubeconfig} get klusterlets.operator.open-cluster-management.io -o custom-columns=NAME:.spec.clusterName --no-headers`
      )
        .toString()
        .trim()
    } else {
      console.log(
        'Cannot get managedCluster because import_kubeconfig is undefined.'
      )
    }
  })

  function execShellCommand(cmd) {
    return new Promise((resolve, reject) => {
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.warn(error)
        }
        resolve(stdout)
      })
    })
  }

  function log({ message = '' }) {
    console.log(message)
  }

  test(`[P3][Sev3][${squad}] should have expected count of pods in ocm on hub cluster.`, async () => {
    var query = searchQueryBuilder({
      filters: [
        { property: 'kind', values: ['pod'] },
        { property: 'namespace', values: ['open-cluster-management'] },
        { property: 'status', values: ['Running'] },
        { property: 'cluster', values: ['local-cluster'] },
      ],
    })
    const [searchRes, cliRes] = await Promise.all([
      sendRequest(query, token),
      execShellCommand(
        'oc get pods -n open-cluster-management --field-selector=status.phase==Running --no-headers | wc -l'
      ),
    ])
    const pods = searchRes.body.data.searchResult[0].items
    expect(pods.length.toString()).toEqual(cliRes.toString().trim())
  }, 20000)

  test(`[P3][Sev3][${squad}] should have expected count of pods in ocm-agent on hub cluster.`, async () => {
    var query = searchQueryBuilder({
      filters: [
        { property: 'kind', values: ['pod'] },
        { property: 'namespace', values: ['open-cluster-management-agent'] },
        { property: 'status', values: ['Running'] },
        { property: 'cluster', values: ['local-cluster'] },
      ],
    })
    const [searchRes, cliRes] = await Promise.all([
      sendRequest(query, token),
      execShellCommand(
        'oc get pods -n open-cluster-management-agent --field-selector=status.phase==Running --no-headers | wc -l'
      ),
    ])
    const pods = searchRes.body.data.searchResult[0].items
    expect(pods.length.toString()).toEqual(cliRes.toString().trim())
  }, 20000)

  test(`[P3][Sev3][${squad}] should have expected count of pods in ocm-agent on imported cluster.`, async () => {
    if (import_kubeconfig) {
      var query = searchQueryBuilder({
        filters: [
          { property: 'kind', values: ['pod'] },
          { property: 'namespace', values: ['open-cluster-management-agent'] },
          { property: 'status', values: ['Running'] },
          { property: 'cluster', values: [managedCluster] },
        ],
      })
      const [searchRes, cliRes] = await Promise.all([
        sendRequest(query, token),
        execShellCommand(
          `oc --kubeconfig ${import_kubeconfig} get pods -n open-cluster-management-agent --field-selector=status.phase==Running --no-headers | wc -l`
        ),
      ])
      const pods = searchRes.body.data.searchResult[0].items
      expect(pods.length.toString()).toEqual(cliRes.toString().trim())
    } else {
      log({
        message: 'Test skipped because import_kubeconfig is undefined.',
      })
    }
  }, 20000)

  test(`[P3][Sev3][${squad}] should have expected count of pods in ocm-agent-addon on hub cluster.`, async () => {
    var query = searchQueryBuilder({
      filters: [
        { property: 'kind', values: ['pod'] },
        {
          property: 'namespace',
          values: ['open-cluster-management-agent-addon'],
        },
        { property: 'status', values: ['Running'] },
        { property: 'cluster', values: ['local-cluster'] },
      ],
    })
    const [searchRes, cliRes] = await Promise.all([
      sendRequest(query, token),
      execShellCommand(
        'oc get pods -n open-cluster-management-agent-addon --field-selector=status.phase==Running --no-headers | wc -l'
      ),
    ])
    const pods = searchRes.body.data.searchResult[0].items
    expect(pods.length.toString()).toEqual(cliRes.toString().trim())
  }, 20000)

  test(`[P3][Sev3][${squad}] should have expected count of pods in ocm-agent-addon on imported cluster.`, async () => {
    if (import_kubeconfig) {
      var query = searchQueryBuilder({
        filters: [
          { property: 'kind', values: ['pod'] },
          {
            property: 'namespace',
            values: ['open-cluster-management-agent-addon'],
          },
          { property: 'status', values: ['Running'] },
          { property: 'cluster', values: [managedCluster] },
        ],
      })
      const [searchRes, cliRes] = await Promise.all([
        sendRequest(query, token),
        execShellCommand(
          `oc --kubeconfig ${import_kubeconfig} get pods -n open-cluster-management-agent-addon --field-selector=status.phase==Running --no-headers | wc -l`
        ),
      ])
      const pods = searchRes.body.data.searchResult[0].items
      expect(pods.length.toString()).toEqual(cliRes.toString().trim())
    } else {
      log({
        message: 'Test skipped because import_kubeconfig is undefined.',
      })
    }
  }, 20000)

  test(`[P3][Sev3][${squad}] should have expected count of pods in kube-system on imported cluster.`, async () => {
    if (import_kubeconfig) {
      var query = searchQueryBuilder({
        filters: [
          { property: 'kind', values: ['pod'] },
          { property: 'namespace', values: ['kube-system'] },
          { property: 'status', values: ['Running'] },
          { property: 'cluster', values: [managedCluster] },
        ],
      })
      const [searchRes, cliRes] = await Promise.all([
        sendRequest(query, token),
        execShellCommand(
          `oc --kubeconfig ${import_kubeconfig} get pods -n kube-system --field-selector=status.phase==Running --no-headers | wc -l`
        ),
      ])
      const pods = searchRes.body.data.searchResult[0].items
      expect(pods.length.toString()).toEqual(cliRes.toString().trim())
    } else {
      log({
        message: 'Test skipped because import_kubeconfig is undefined.',
      })
    }
  }, 20000)
})
