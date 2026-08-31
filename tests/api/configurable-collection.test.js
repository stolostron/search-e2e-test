// Copyright Contributors to the Open Cluster Management project

jest.retryTimes(global.retry, { logErrorsBeforeRetry: true })

const { execSync } = require('child_process')

const squad = require('../../config').get('squadName')
const { getSearchApiRoute, getKubeadminToken, resolveAcmNamespace } = require('../common-lib/clusterAccess')
const { searchQueryBuilder, sendRequest } = require('../common-lib/searchClient')
const { sleep } = require('../common-lib/sleep')

async function assertFeatureFlagEnabled(namespace) {
  const getFlag = () =>
    execSync(
      `oc get pod -n ${namespace} -l name=search-collector -o jsonpath='{.items[*].spec.containers[0].env[?(@.name=="FEATURE_CONFIGURABLE_COLLECTION")].value}'`,
      { stdio: ['pipe', 'pipe', 'ignore'] }
    )
      .toString()
      .trim()

  if (getFlag() === 'true') return

  execSync(
    `oc patch search search-v2-operator -n ${namespace} --type merge -p '${JSON.stringify({
      spec: { deployments: { collector: { envVar: [{ name: 'FEATURE_CONFIGURABLE_COLLECTION', value: 'true' }] } } },
    })}'`,
    { stdio: ['pipe', 'pipe', 'ignore'] }
  )
  await waitForCondition(() => getFlag() === 'true', { timeout: 120000 })
}

function getSearchCRUid(namespace) {
  return execSync(`oc get search search-v2-operator -n ${namespace} -o jsonpath='{.metadata.uid}'`, {
    stdio: ['pipe', 'pipe', 'ignore'],
  })
    .toString()
    .trim()
}

function applyCollectorConfig(namespace, name, rules, options = {}) {
  const metadata = { name, namespace }
  if (options.labels) {
    metadata.labels = options.labels
  }
  if (options.ownerReferences) {
    metadata.ownerReferences = options.ownerReferences
  }

  const manifest = {
    apiVersion: 'search.open-cluster-management.io/v1alpha1',
    kind: 'CollectorConfig',
    metadata,
    spec: { collectionRules: rules },
  }

  const asFlag = options.asServiceAccount ? ` --as=${options.asServiceAccount}` : ''
  execSync(`echo '${JSON.stringify(manifest)}' | oc apply${asFlag} -f -`)
}

function applyIntegrationCollectorConfig(namespace, name, rules, options = {}) {
  const configOptions = {
    labels: { 'search.open-cluster-management.io/config-type': 'integration' },
    asServiceAccount: `system:serviceaccount:${namespace}:search-v2-operator`,
  }
  if (options.includeOwnerReferences !== false) {
    const searchUid = getSearchCRUid(namespace)
    configOptions.ownerReferences = [
      {
        apiVersion: 'search.open-cluster-management.io/v1alpha1',
        kind: 'Search',
        name: 'search-v2-operator',
        uid: searchUid,
        controller: true,
        blockOwnerDeletion: true,
      },
    ]
  }
  applyCollectorConfig(namespace, name, rules, configOptions)
}

function deleteCollectorConfig(namespace, name, options = {}) {
  const asFlag = options.asServiceAccount ? ` --as=${options.asServiceAccount}` : ''
  execSync(`oc delete collectorconfig ${name} -n ${namespace}${asFlag} --ignore-not-found`, {
    stdio: ['pipe', 'pipe', 'ignore'],
  })
}

function getMergedCollectorConfig(namespace) {
  const output = execSync(`oc get collectorconfig merged-collector-config -n ${namespace} -o json`, {
    stdio: ['pipe', 'pipe', 'ignore'],
  })
    .toString()
    .trim()
  return JSON.parse(output)
}

async function searchItems(token, filters) {
  const query = searchQueryBuilder({ filters })
  const res = await sendRequest(query, token)
  return res.body.data.searchResult[0].items || []
}

async function waitForCondition(fn, { interval = 5000, timeout = 60000 } = {}) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const result = await fn()
    if (result) return result
    await sleep(interval)
  }
  throw new Error(`waitForCondition timed out after ${timeout}ms`)
}

describe(`[P2][Sev2][${squad}] Configurable Collection`, () => {
  let token
  let acmNamespace

  beforeAll(async () => {
    token = getKubeadminToken()
    searchApiRoute = await getSearchApiRoute()
    acmNamespace = resolveAcmNamespace()
    await assertFeatureFlagEnabled(acmNamespace)
  }, 180000)

  afterAll(() => {
    try {
      deleteCollectorConfig(acmNamespace, 'user-collector-config')
    } catch (_) {}
    try {
      deleteCollectorConfig(acmNamespace, 'test-integration-config', {
        asServiceAccount: `system:serviceaccount:${acmNamespace}:search-v2-operator`,
      })
    } catch (_) {}
  }, 120000)

  // ACM-21883 - RHACM4K-65231
  test(`[P2][Sev2][${squad}] ACM-21883: should collect additional fields configured by integration and user CollectorConfigs`, async () => {
    const integrationName = 'test-integration-config'
    const userName = 'user-collector-config'

    try {
      applyIntegrationCollectorConfig(acmNamespace, integrationName, [
        {
          action: 'include',
          resourceSelector: { apiGroups: ['monitoring.coreos.com'], kinds: ['Alertmanager'] },
          collectConditions: true,
          fields: [{ name: 'replicas', jsonPath: '{.spec.replicas}', type: 'integer' }],
        },
      ])

      applyCollectorConfig(acmNamespace, userName, [
        {
          action: 'include',
          resourceSelector: { apiGroups: ['monitoring.coreos.com'], kinds: ['Alertmanager'] },
          fields: [{ name: 'version', jsonPath: '{.spec.version}', type: 'string' }],
        },
      ])

      // Wait for merged-collector-config to contain fields from both configs.
      await waitForCondition(() => {
        const merged = getMergedCollectorConfig(acmNamespace)
        const mergedStr = JSON.stringify(merged.spec.collectionRules)
        return mergedStr.includes('replicas') && mergedStr.includes('version')
      })

      // Regular user cannot modify integration config.
      expect(() => {
        execSync(
          `oc patch collectorconfig ${integrationName} -n ${acmNamespace} --type=json ` +
            '-p \'[{"op":"replace","path":"/spec/collectionRules/0/fields/0/name","value":"updatedReplicas"}]\'',
          { stdio: ['pipe', 'pipe', 'pipe'] }
        )
      }).toThrow()

      // Operator SA can modify integration config.
      execSync(
        `oc patch collectorconfig ${integrationName} -n ${acmNamespace} ` +
          `--as=system:serviceaccount:${acmNamespace}:search-v2-operator --type=json ` +
          '-p \'[{"op":"replace","path":"/spec/collectionRules/0/fields/0/name","value":"updatedReplicas"}]\'',
        { stdio: ['pipe', 'pipe', 'ignore'] }
      )

      // Wait for Search API to return custom fields for Alertmanager.
      await waitForCondition(
        async () => {
          const items = await searchItems(token, [
            { property: 'kind', values: ['Alertmanager'] },
            { property: 'apigroup', values: ['monitoring.coreos.com'] },
          ])
          return items.length > 0 && items[0].updatedReplicas !== undefined && items[0].version !== undefined
        },
        { timeout: 120000 }
      )
    } finally {
      deleteCollectorConfig(acmNamespace, userName)
    }
  }, 180000)

  // ACM-32738 - RHACM4K-65204
  test(`[P2][Sev2][${squad}] ACM-32738: should respect configured priorities when collecting additionalPrinterColumns`, async () => {
    const userName = 'user-collector-config'
    const machineFilters = [
      { property: 'kind', values: ['Machine'] },
      { property: 'apigroup', values: ['machine.openshift.io'] },
    ]
    const p0Fields = ['Phase', 'Type', 'Region', 'Zone', 'Age']
    const p1Fields = ['Node', 'ProviderID', 'State']
    const makeRule = (priority) => [
      {
        action: 'include',
        collectAdditionalPrinterColumnsPriority: priority,
        fieldSuffix: '',
        resourceSelector: { apiGroups: ['machine.openshift.io'], kinds: ['Machine'] },
      },
    ]

    try {
      // Priority 0: should collect Phase, Type, Region, Zone, Age but NOT Node, ProviderID, State.
      applyCollectorConfig(acmNamespace, userName, makeRule(0))

      await waitForCondition(async () => {
        const items = await searchItems(token, machineFilters)
        return items.length > 0 && p0Fields.every((f) => items[0][f] !== undefined)
      })

      const items = await searchItems(token, machineFilters)
      for (const field of p1Fields) {
        expect(items[0]).not.toHaveProperty(field)
      }

      // Priority 1: should collect all fields including Node, ProviderID, State.
      applyCollectorConfig(acmNamespace, userName, makeRule(1))

      await waitForCondition(async () => {
        const items = await searchItems(token, machineFilters)
        return items.length > 0 && [...p0Fields, ...p1Fields].every((f) => items[0][f] !== undefined)
      })
    } finally {
      deleteCollectorConfig(acmNamespace, userName)
    }
  }, 180000)
})
