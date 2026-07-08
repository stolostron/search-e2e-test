// Copyright Contributors to the Open Cluster Management project

jest.retryTimes(global.retry, { logErrorsBeforeRetry: true })

const { execSync } = require('child_process')

const squad = require('../../config').get('squadName')
const {
  getSearchApiRoute,
  getKubeadminToken,
  getLocalClusterName,
  resolveAcmNamespace,
} = require('../common-lib/clusterAccess')
const { searchQueryBuilder, sendRequest } = require('../common-lib/searchClient')
const { sleep } = require('../common-lib/sleep')

// TODO: run this separate from all the other api tests until feature flag enabled by default

/**
 * Enable the FEATURE_CONFIGURABLE_COLLECTION flag on the collector by patching the Search CR.
 * The operator will reconcile and restart the collector pod with the new env var.
 */
function enableFeatureFlag(namespace) {
  execSync(
    `oc patch search search-v2-operator -n ${namespace} --type=merge -p '` +
      JSON.stringify({
        spec: {
          deployments: {
            collector: {
              envVar: [{ name: 'FEATURE_CONFIGURABLE_COLLECTION', value: 'true' }],
            },
          },
        },
      }) +
      "'"
  )
}

/**
 * Remove the feature flag from the Search CR to restore the default collector config.
 */
function disableFeatureFlag(namespace) {
  execSync(
    `oc patch search search-v2-operator -n ${namespace} --type=json -p '[{"op":"remove","path":"/spec/deployments/collector/envVar"}]'`,
    { stdio: ['pipe', 'pipe', 'ignore'] }
  )
}

/**
 * Wait until collector pod has the FEATURE_CONFIGURABLE_COLLECTION env var set (or unset).
 */
async function waitForCollectorRestart(namespace, expectEnabled, timeoutMs = 120000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const envOutput = execSync(
        `oc get pod -n ${namespace} -l component=search-collector -o jsonpath='{.items[*].spec.containers[0].env[?(@.name=="FEATURE_CONFIGURABLE_COLLECTION")].value}'`,
        { stdio: ['pipe', 'pipe', 'ignore'] }
      )
        .toString()
        .trim()

      const ready = execSync(
        `oc get pod -n ${namespace} -l component=search-collector -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}'`,
        { stdio: ['pipe', 'pipe', 'ignore'] }
      )
        .toString()
        .trim()

      if (expectEnabled && envOutput.includes('true') && ready === 'True') {
        return
      }
      if (!expectEnabled && !envOutput.includes('true') && ready === 'True') {
        return
      }
    } catch (_) {
      // Pod may be terminating, keep waiting.
    }
    await sleep(5000)
  }
  throw new Error(`Timed out waiting for collector restart (expectEnabled=${expectEnabled})`)
}

/**
 * Apply a CollectorConfig CR with the given collection rules.
 */
function applyCollectorConfig(namespace, name, rules) {
  const manifest = {
    apiVersion: 'search.open-cluster-management.io/v1alpha1',
    kind: 'CollectorConfig',
    metadata: { name, namespace },
    spec: { collectionRules: rules },
  }
  execSync(`echo '${JSON.stringify(manifest)}' | oc apply -f -`)
}

/**
 * Delete a CollectorConfig CR.
 */
function deleteCollectorConfig(namespace, name) {
  execSync(`oc delete collectorconfig ${name} -n ${namespace} --ignore-not-found`, {
    stdio: ['pipe', 'pipe', 'ignore'],
  })
}

/**
 * Query search for resources matching the given filters and return the items array.
 */
async function searchItems(token, filters) {
  const query = searchQueryBuilder({ filters })
  const res = await sendRequest(query, token)
  return res.body.data.searchResult[0].items || []
}

const TEST_NS = 'search-cc-e2e-test'
const COLLECTOR_CONFIG_NAME = 'e2e-test-config'

describe(`[P2][Sev2][${squad}] Configurable Collection`, () => {
  let token
  let searchApiRoute
  let acmNamespace

  beforeAll(async () => {
    token = getKubeadminToken()
    searchApiRoute = await getSearchApiRoute()
    acmNamespace = resolveAcmNamespace()

    // Create a test namespace with a known ConfigMap for custom-field testing
    // and a Lease for exclusion testing (coordination.k8s.io is not webhook-protected).
    execSync(`oc create namespace ${TEST_NS} --dry-run=client -o yaml | oc apply -f -`)
    execSync(
      `oc create configmap cc-test-cm -n ${TEST_NS} --from-literal=key=value --dry-run=client -o yaml | oc apply -f -`
    )
    execSync(
      `echo '${JSON.stringify({
        apiVersion: 'coordination.k8s.io/v1',
        kind: 'Lease',
        metadata: { name: 'cc-test-lease', namespace: TEST_NS },
        spec: { holderIdentity: 'e2e-test', leaseDurationSeconds: 600 },
      })}' | oc apply -f -`
    )

    // Enable the feature flag and wait for collector restart.
    enableFeatureFlag(acmNamespace)
    await waitForCollectorRestart(acmNamespace, true)

    // Allow time for initial indexing after restart.
    await sleep(15000)
  }, 180000)

  afterAll(async () => {
    // Clean up: remove CollectorConfig, feature flag, and test namespace.
    deleteCollectorConfig(acmNamespace, COLLECTOR_CONFIG_NAME)
    disableFeatureFlag(acmNamespace)

    try {
      await waitForCollectorRestart(acmNamespace, false)
    } catch (_) {
      console.warn('Warning: collector did not fully restart after disabling feature flag.')
    }

    execSync(`oc delete namespace ${TEST_NS} --ignore-not-found`, {
      stdio: ['pipe', 'pipe', 'ignore'],
    })
  }, 180000)

  test(`[P2][Sev2][${squad}] should index Leases by default when no CollectorConfig exists`, async () => {
    const items = await searchItems(token, [
      { property: 'kind', values: ['Lease'] },
      { property: 'namespace', values: [TEST_NS] },
      { property: 'name', values: ['cc-test-lease'] },
      { property: 'cluster', values: [getLocalClusterName()] },
    ])

    expect(items).toHaveLength(1)
    expect(items[0].name).toBe('cc-test-lease')
  }, 30000)

  // ACM-35522
  test(`[P2][Sev2][${squad}] should exclude Leases when CollectorConfig excludes coordination.k8s.io`, async () => {
    // Exclude coordination.k8s.io (Leases). This API group is not webhook-protected.
    applyCollectorConfig(acmNamespace, COLLECTOR_CONFIG_NAME, [
      {
        action: 'exclude',
        resourceSelector: { apiGroups: ['coordination.k8s.io'], kinds: ['*'] },
      },
    ])

    // Wait for the collector to process the config change and re-sync.
    await sleep(30000)

    const items = await searchItems(token, [
      { property: 'kind', values: ['Lease'] },
      { property: 'namespace', values: [TEST_NS] },
      { property: 'name', values: ['cc-test-lease'] },
      { property: 'cluster', values: [getLocalClusterName()] },
    ])

    expect(items).toHaveLength(0)
  }, 60000)

  test(`[P2][Sev2][${squad}] should re-include Leases after removing exclusion rule`, async () => {
    // Remove the exclusion by applying a config with no exclude rules.
    applyCollectorConfig(acmNamespace, COLLECTOR_CONFIG_NAME, [
      {
        action: 'include',
        resourceSelector: {
          apiGroups: ['coordination.k8s.io'],
          kinds: ['Lease'],
        },
      },
    ])

    // Wait for collector to pick up the change and re-list Leases.
    await sleep(30000)

    const items = await searchItems(token, [
      { property: 'kind', values: ['Lease'] },
      { property: 'namespace', values: [TEST_NS] },
      { property: 'name', values: ['cc-test-lease'] },
      { property: 'cluster', values: [getLocalClusterName()] },
    ])

    expect(items).toHaveLength(1)
    expect(items[0].name).toBe('cc-test-lease')
  }, 60000)

  // ACM-18531
  test(`[P2][Sev2][${squad}] should collect custom fields defined in CollectorConfig`, async () => {
    // Apply a CollectorConfig that adds a custom field to ConfigMaps.
    // Use metadata.resourceVersion — a lightweight scalar present on every resource.
    applyCollectorConfig(acmNamespace, COLLECTOR_CONFIG_NAME, [
      {
        action: 'include',
        resourceSelector: { apiGroups: [''], kinds: ['ConfigMap'] },
        fields: [
          {
            name: 'resourceVersion',
            jsonPath: '{.metadata.resourceVersion}',
          },
        ],
      },
    ])

    await sleep(30000)

    const items = await searchItems(token, [
      { property: 'kind', values: ['ConfigMap'] },
      { property: 'namespace', values: [TEST_NS] },
      { property: 'name', values: ['cc-test-cm'] },
      { property: 'cluster', values: [getLocalClusterName()] },
    ])

    expect(items).toHaveLength(1)
    expect(items[0].name).toBe('cc-test-cm')
    expect(items[0]).toHaveProperty('resourceVersion')
  }, 60000)

  test(`[P2][Sev2][${squad}] should clean up CollectorConfig and restore default behavior`, async () => {
    deleteCollectorConfig(acmNamespace, COLLECTOR_CONFIG_NAME)

    // After deleting the CollectorConfig, the operator merges remaining configs
    // (none), producing a default merged-collector-config. Collector reloads.
    await sleep(30000)

    const items = await searchItems(token, [
      { property: 'kind', values: ['ConfigMap'] },
      { property: 'namespace', values: [TEST_NS] },
      { property: 'name', values: ['cc-test-cm'] },
      { property: 'cluster', values: [getLocalClusterName()] },
    ])

    expect(items).toHaveLength(1)
    expect(items[0].name).toBe('cc-test-cm')
    expect(items[0]).not.toHaveProperty('resourceVersion')
  }, 60000)
})
