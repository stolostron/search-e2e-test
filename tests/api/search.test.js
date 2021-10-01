// Copyright (c) 2020 Red Hat, Inc.

const squad = require('../../config').get('squadName')
const {
  getSearchApiRoute,
  getToken,
  getKubeConfig,
  searchQueryBuilder,
  sendRequest,
  getPods,
  deletePod,
} = require('../common-lib/clusterAccess')
const { exec, execSync } = require('child_process')

describe('RHACM4K-1695: Search - verify managed cluster info in the search page', () => {
  beforeAll(async () => {
    // Log in and get access token
    token = getToken()

    // Create a route to access the Search API.
    searchApiRoute = await getSearchApiRoute()

    // Temporary workaround. TODO: Get SSL cert from cluster.
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
  })

  // Cleanup and teardown here.
  afterAll(() => {})

  test(`[P1][Sev1][${squad}] Search - verify managed cluster info in the search page.`, async () => {
    var query = searchQueryBuilder({
      filters: [
        { property: 'name', values: ['!local-cluster'] },
        { property: 'ManagedClusterJoined', values: ['True'] },
      ],
    })
    var res = await sendRequest(query, token)
    expect(res.body.data.searchResult[0].items[0].ManagedClusterJoined).toEqual(
      'True'
    )
    // expect(res.body.data.searchResult[0].items[0].status).toEqual("OK")

    query = searchQueryBuilder({
      filters: [
        { property: 'cluster', values: ['!local-cluster'] },
        { property: 'kind', values: ['pod'] },
        { property: 'namespace', values: ['open-cluster-management-agent'] },
      ],
    })
    res = await sendRequest(query, token)

    var pods = res.body.data.searchResult[0].items
    pods.forEach((element) => {
      expect(element.status).toEqual('Running')
    })
  }, 20000)
})

describe('RHACM4K-1696: Search - Verify search result with common filter and conditions', () => {
  const app = 'console'
  const namespace = 'openshift-console'

  test(`[P2][Sev2][${squad}] Verify a deleted pod is recreated.`, async () => {
    var query = searchQueryBuilder({
      filters: [
        { property: 'kind', values: ['deployment'] },
        { property: 'name', values: [app] },
        { property: 'namespace', values: [namespace] },
      ],
    })
    var res = await sendRequest(query, token)
    expect(res.body.data.searchResult[0].items[0].current).toEqual(2)
    var pods = getPods(namespace)
    deletePod(pods[0][0], namespace)
      .then(() => {
        var res = sendRequest(query, token)
        expect(res.body.data.searchResult[0].items[0].current).toEqual(2)
      })
      .catch(() => {})
  }, 20000)

  test(`[P2][Sev2][${squad}] Search kind application on specific namespace.`, async () => {
    var query = searchQueryBuilder({
      filters: [
        { property: 'kind', values: ['deployment'] },
        { property: 'name', values: [app] },
        { property: 'namespace', values: [namespace] },
      ],
    })
    var res = await sendRequest(query, token)
    expect(res.body.data.searchResult[0].items[0].name).toEqual(app)
    expect(res.body.data.searchResult[0].items[0].kind).toEqual('deployment')
    expect(res.body.data.searchResult[0].items[0].namespace).toEqual(namespace)
  }, 20000)

  test(`[P2][Sev2][${squad}] Search kind pod and namespace open-cluster-management.`, async () => {
    var query = searchQueryBuilder({
      filters: [
        { property: 'kind', values: ['pod'] },
        { property: 'namespace', values: ['open-cluster-management'] },
        { property: 'status', values: ['Running'] },
      ],
    })
    var res = await sendRequest(query, token)
    var pods = res.body.data.searchResult[0].items
    pods.forEach((element) => {
      expect(element.status).toEqual('Running')
    })
  }, 20000)

  test(`[P2][Sev2][${squad}] Search kind pod on specific cluster.`, async () => {
    var query = searchQueryBuilder({
      filters: [
        { property: 'kind', values: ['pod'] },
        { property: 'cluster', values: ['local-cluster'] },
        { property: 'status', values: ['Running'] },
      ],
    })
    var res = await sendRequest(query, token)
    var pods = res.body.data.searchResult[0].items
    pods.forEach((element) => {
      expect(element.status).toEqual('Running')
    })
  }, 20000)

  test(`[P2][Sev2][${squad}] Search kind:certpolicycontroller.`, async () => {
    var query = searchQueryBuilder({
      filters: [{ property: 'kind', values: ['certpolicycontroller'] }],
    })
    var res = await sendRequest(query, token)
    expect(res.body.data.searchResult[0].items[0].name).toEqual(
      'klusterlet-addon-certpolicyctrl'
    )
    expect(res.body.data.searchResult[0].items[0].kind).toEqual(
      'certpolicycontroller'
    )
    expect(res.body.data.searchResult[0].items[0].namespace).toEqual(
      'open-cluster-management-agent-addon'
    )
  }, 20000)

  test(`[P2][Sev2][${squad}] Search kind:iampolicycontroller.`, async () => {
    var query = searchQueryBuilder({
      filters: [{ property: 'kind', values: ['iampolicycontroller'] }],
    })
    var res = await sendRequest(query, token)
    expect(res.body.data.searchResult[0].items[0].name).toEqual(
      'klusterlet-addon-iampolicyctrl'
    )
    expect(res.body.data.searchResult[0].items[0].kind).toEqual(
      'iampolicycontroller'
    )
    expect(res.body.data.searchResult[0].items[0].namespace).toEqual(
      'open-cluster-management-agent-addon'
    )
  }, 20000)
})

describe('RHACM4K-1709: Search - Search using filters', () => {
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

describe('RHACM4K-913: Search - common filter and conditions', () => {
  // Get kubeconfig for imported clusters
  var kubeconfigs = getKubeConfig()

  // Get managed cluster
  var import_kubeconfig = kubeconfigs.find((k) => k.includes('import'))

  beforeAll(async () => {
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
