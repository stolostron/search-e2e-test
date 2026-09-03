// Copyright Contributors to the Open Cluster Management project

jest.retryTimes(global.retry, { logErrorsBeforeRetry: true })

const { execSync } = require('child_process')

const squad = require('../../config').get('squadName')
const { getSearchApiRoute, getKubeadminToken, resolveAcmNamespace } = require('../common-lib/clusterAccess')
const { searchQueryBuilder, sendRequest } = require('../common-lib/searchClient')
const { sleep } = require('../common-lib/sleep')

const backupLabel = 'cluster.open-cluster-management.io/backup'

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
  // silent: pipe stderr so expected webhook rejections don't spam the test log.
  const execOptions = options.silent ? { stdio: ['pipe', 'pipe', 'pipe'] } : {}
  execSync(`echo '${JSON.stringify(manifest)}' | oc apply${asFlag} -f -`, execOptions)
}

function applyResource(manifest) {
  execSync(`echo '${JSON.stringify(manifest)}' | oc apply -f -`, { stdio: ['pipe', 'pipe', 'ignore'] })
}

function deleteResource(kind, name, namespace) {
  const nsFlag = namespace ? ` -n ${namespace}` : ''
  execSync(`oc delete ${kind} ${name}${nsFlag} --ignore-not-found`, { stdio: ['pipe', 'pipe', 'ignore'] })
}

const pauseImage = 'registry.k8s.io/pause:3.9'

// API-server phrasing wrapped around every admission webhook rejection.
const webhookDenied = /denied the request/

// Build Search API filters from the properties that are set.
function itemFilters({ kind, apigroup, namespace, name }) {
  const filters = []
  if (kind) filters.push({ property: 'kind', values: [kind] })
  if (apigroup) filters.push({ property: 'apigroup', values: [apigroup] })
  if (namespace) filters.push({ property: 'namespace', values: [namespace] })
  if (name) filters.push({ property: 'name', values: [name] })
  return filters
}

// Match a collection rule by action and (optionally) an apiGroup/kind it selects.
function matchesRule(rule, { action, apiGroup, kind }) {
  if (action && rule.action !== action) return false
  if (apiGroup && !(rule.resourceSelector?.apiGroups || []).includes(apiGroup)) return false
  if (kind && !(rule.resourceSelector?.kinds || []).includes(kind)) return false
  return true
}

function podTemplate(name) {
  return {
    metadata: { labels: { app: name } },
    spec: { containers: [{ name: 'pause', image: pauseImage }] },
  }
}

function makeDeployment(namespace, name) {
  return {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: { name, namespace },
    spec: { replicas: 1, selector: { matchLabels: { app: name } }, template: podTemplate(name) },
  }
}

function makeStatefulSet(namespace, name) {
  return {
    apiVersion: 'apps/v1',
    kind: 'StatefulSet',
    metadata: { name, namespace },
    spec: { serviceName: name, replicas: 1, selector: { matchLabels: { app: name } }, template: podTemplate(name) },
  }
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

function getCollectorConfig(namespace, name) {
  const output = execSync(`oc get collectorconfig ${name} -n ${namespace} -o json`, {
    stdio: ['pipe', 'pipe', 'ignore'],
  })
    .toString()
    .trim()
  return JSON.parse(output)
}

function getMergedCollectorConfig(namespace) {
  return getCollectorConfig(namespace, 'merged-collector-config')
}

function getIntegrationCollectorConfigs(namespace) {
  const output = execSync(
    `oc get collectorconfig -n ${namespace} -l search.open-cluster-management.io/config-type=integration -o json`,
    { stdio: ['pipe', 'pipe', 'ignore'] }
  )
    .toString()
    .trim()
  return JSON.parse(output).items || []
}

async function searchItems(token, filters) {
  const query = searchQueryBuilder({ filters })
  const res = await sendRequest(query, token)
  return res.body.data.searchResult[0].items || []
}

// Poll the Search API until the filtered resource is indexed, resolving to the matching items.
// Optional `match` requires every returned item to satisfy it.
// Negative cases are asserted separately over an observation window.
async function waitForIndexed(token, filters, { match } = {}, options = {}) {
  return waitForCondition(async () => {
    const items = await searchItems(token, filters)
    if (items.length === 0 || (match && !items.every(match))) return false
    return items
  }, options)
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

// Wait until the merged config has (present) or no longer has (present:false) a rule matching `matcher`.
async function waitForMergedRule(namespace, matcher, { present = true } = {}, options = {}) {
  return waitForCondition(() => {
    const has = getMergedCollectorConfig(namespace).spec.collectionRules.some(matcher)
    return present ? has : !has
  }, options)
}

// Assert a filtered resource stays absent from the Search index for the whole window,
// so indexing lag can't make an exclusion assertion pass prematurely.
async function expectRemainsUnindexed(token, filters, { duration = 20000, interval = 5000 } = {}) {
  const end = Date.now() + duration
  while (Date.now() < end) {
    const items = await searchItems(token, filters)
    expect(items).toHaveLength(0)
    await sleep(interval)
  }
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
      }).toThrow(webhookDenied)

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
      deleteCollectorConfig(acmNamespace, integrationName, {
        asServiceAccount: `system:serviceaccount:${acmNamespace}:search-v2-operator`,
      })
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

  // ACM-20052 - RHACM4K backup label
  test(`[P2][Sev2][${squad}] ACM-20052: should auto-add backup label to user CollectorConfig but not to merged-collector-config`, async () => {
    const userName = 'user-collector-config'

    try {
      // Create a user CollectorConfig without specifying any labels.
      applyCollectorConfig(acmNamespace, userName, [
        {
          action: 'include',
          resourceSelector: { apiGroups: ['monitoring.coreos.com'], kinds: ['Alertmanager'] },
          fields: [{ name: 'version', jsonPath: '{.spec.version}', type: 'string' }],
        },
      ])

      // Operator should automatically add the backup label to the user CollectorConfig.
      const userLabels = await waitForCondition(() => {
        const labels = getCollectorConfig(acmNamespace, userName).metadata.labels || {}
        return labels[backupLabel] !== undefined && labels
      })
      expect(userLabels[backupLabel]).toBe('')

      // The operator-managed merged-collector-config must NOT receive the backup label.
      const mergedLabels = getMergedCollectorConfig(acmNamespace).metadata.labels || {}
      expect(mergedLabels).not.toHaveProperty(backupLabel)
    } finally {
      deleteCollectorConfig(acmNamespace, userName)
    }
  }, 180000)

  // ACM-37052 - RHACM4K-65858
  test(`[P2][Sev2][${squad}] ACM-37052: should collect and index a ClusterServiceVersion covered by the seeded olm-integration CollectorConfig`, async () => {
    // Gate on olm-integration existing; its rules are asserted in the seed test below.
    // TODO: Assert a specific attribute once an integration config targets non-default resources.
    await waitForCondition(() => {
      try {
        getCollectorConfig(acmNamespace, 'olm-integration')
        return true
      } catch (_) {
        return false
      }
    })

    // Select an existing ClusterServiceVersion from the cluster.
    const [csvNamespace, csvName] = execSync(
      `oc get csv -A -o jsonpath='{.items[0].metadata.namespace}{" "}{.items[0].metadata.name}'`,
      { stdio: ['pipe', 'pipe', 'ignore'] }
    )
      .toString()
      .trim()
      .split(' ')

    expect(csvNamespace).toBeTruthy()
    expect(csvName).toBeTruthy()

    // Search must return the selected ClusterServiceVersion, which is covered by olm-integration.
    const csvFilters = [
      { property: 'kind', values: ['ClusterServiceVersion'] },
      { property: 'name', values: [csvName] },
      { property: 'namespace', values: [csvNamespace] },
    ]

    const item = await waitForCondition(
      async () => {
        const items = await searchItems(token, csvFilters)
        return items.find((i) => i.name === csvName && i.namespace === csvNamespace)
      },
      { timeout: 120000 }
    )

    expect(item.kind).toBe('ClusterServiceVersion')
    expect(item.name).toBe(csvName)
    expect(item.namespace).toBe(csvNamespace)
    expect(item.apigroup).toBe('operators.coreos.com')
  }, 180000)

  // ACM-37052 - RHACM4K-65807
  test(`[P2][Sev2][${squad}] ACM-37052: should seed the built-in integration CollectorConfigs with expected metadata and rules`, async () => {
    // The seven built-in integration CollectorConfigs and the apiGroups each one collects.
    const expectedConfigs = {
      'app-lifecycle-integration': ['apps.open-cluster-management.io', 'app.k8s.io'],
      'argo-integration': ['argoproj.io'],
      'cnv-integration': [
        'kubevirt.io',
        'cdi.kubevirt.io',
        'migrations.kubevirt.io',
        'clone.kubevirt.io',
        'instancetype.kubevirt.io',
        'snapshot.kubevirt.io',
        'networkaddonsoperator.network.kubevirt.io',
        'k8s.cni.cncf.io',
        'storage.k8s.io',
        'snapshot.storage.k8s.io',
        'snapshot.storage.kubevirt.io',
      ],
      'gatekeeper-integration': ['constraints.gatekeeper.sh'],
      'grc-integration': ['policy.open-cluster-management.io', 'wgpolicyk8s.io'],
      'kyverno-integration': ['kyverno.io', 'policies.kyverno.io'],
      'olm-integration': ['operators.coreos.com'],
    }

    const searchUid = getSearchCRUid(acmNamespace)

    // Wait until every expected built-in integration config has been seeded by the operator.
    const configs = await waitForCondition(() => {
      const seeded = getIntegrationCollectorConfigs(acmNamespace)
      const names = seeded.map((c) => c.metadata.name)
      return Object.keys(expectedConfigs).every((name) => names.includes(name)) && seeded
    })

    const byName = {}
    for (const config of configs) {
      byName[config.metadata.name] = config
    }

    for (const [name, expectedApiGroups] of Object.entries(expectedConfigs)) {
      const config = byName[name]
      expect(config).toBeDefined()

      const labels = config.metadata.labels || {}
      expect(labels['search.open-cluster-management.io/config-type']).toBe('integration')

      // ACM-42665 (fix: stolostron/search-v2-operator#866): operator-owned integration
      // CollectorConfigs must NOT carry the backup label, so Velero's restore relabel
      // patch is not denied by the Search webhook.
      expect(labels).not.toHaveProperty(backupLabel)

      const owner = (config.metadata.ownerReferences || [])[0] || {}
      expect(owner.kind).toBe('Search')
      expect(owner.name).toBe('search-v2-operator')
      expect(owner.uid).toBe(searchUid)

      const rules = config.spec.collectionRules || []
      expect(rules).toHaveLength(1)
      expect(rules[0].action).toBe('include')
      expect(rules[0].resourceSelector.kinds).toEqual(['*'])
      expect([...rules[0].resourceSelector.apiGroups].sort()).toEqual([...expectedApiGroups].sort())
    }
  }, 180000)

  // ACM-35522 - RHACM4K-65310
  test(`[P2][Sev2][${squad}] ACM-35522: should reject invalid exclude rules via the admission webhook`, () => {
    const userName = 'user-collector-config'
    const invalidRules = [
      // Wildcard exclude on a protected API group.
      [{ action: 'exclude', resourceSelector: { apiGroups: ['cluster.open-cluster-management.io'], kinds: ['*'] } }],
      // Global wildcard exclusion.
      [{ action: 'exclude', resourceSelector: { apiGroups: ['*'], kinds: ['*'] } }],
      // collectAnnotations is not allowed on an exclude rule.
      [
        {
          action: 'exclude',
          resourceSelector: { apiGroups: ['apps'], kinds: ['Deployment'] },
          collectAnnotations: true,
        },
      ],
    ]

    try {
      for (const rules of invalidRules) {
        expect(() => applyCollectorConfig(acmNamespace, userName, rules, { silent: true })).toThrow(webhookDenied)
      }

      // A rejected CollectorConfig must never be created.
      const created = execSync(`oc get collectorconfig ${userName} -n ${acmNamespace} --ignore-not-found -o name`, {
        stdio: ['pipe', 'pipe', 'pipe'],
      })
        .toString()
        .trim()
      expect(created).toBe('')
    } finally {
      deleteCollectorConfig(acmNamespace, userName)
    }
  }, 60000)

  // ACM-35522 - RHACM4K-65232
  test(`[P2][Sev2][${squad}] ACM-35522: should apply a specific include that overrides an earlier wildcard exclude`, async () => {
    const userName = 'user-collector-config'
    // Unique namespace per run to avoid collisions with stale Search records.
    const ns = `collector-rule-${Date.now().toString(36)}`
    const deployName = 'rule-test-deployment'
    const stsName = 'rule-test-statefulset'

    try {
      // Wildcard exclude first, then a specific include to verify last-match-wins.
      applyCollectorConfig(acmNamespace, userName, [
        { action: 'exclude', resourceSelector: { apiGroups: ['apps'], kinds: ['*'] } },
        {
          action: 'include',
          resourceSelector: { apiGroups: ['apps'], kinds: ['Deployment'] },
          fields: [{ name: 'testReplicas', jsonPath: '{.spec.replicas}', type: 'string' }],
        },
      ])

      // Verify the merged config preserves the rule order.
      await waitForCondition(() => {
        const rules = getMergedCollectorConfig(acmNamespace).spec.collectionRules
        const excludeIdx = rules.findIndex((r) => matchesRule(r, { action: 'exclude', apiGroup: 'apps', kind: '*' }))
        const includeIdx = rules.findIndex(
          (r) =>
            matchesRule(r, { action: 'include', apiGroup: 'apps', kind: 'Deployment' }) &&
            (r.fields || []).some((f) => f.name === 'testReplicas')
        )
        return excludeIdx !== -1 && includeIdx !== -1 && excludeIdx < includeIdx
      })

      applyResource({ apiVersion: 'v1', kind: 'Namespace', metadata: { name: ns } })
      applyResource(makeDeployment(ns, deployName))
      applyResource(makeStatefulSet(ns, stsName))

      // Deployment is re-included and exposes the configured custom field.
      const deployments = await waitForIndexed(
        token,
        itemFilters({ kind: 'Deployment', apigroup: 'apps', namespace: ns, name: deployName }),
        { match: (i) => String(i.testReplicas) === '1' },
        { timeout: 120000 }
      )
      expect(String(deployments[0].testReplicas)).toBe('1')

      // StatefulSet remains excluded by apps/*.
      await expectRemainsUnindexed(
        token,
        itemFilters({ kind: 'StatefulSet', apigroup: 'apps', namespace: ns, name: stsName })
      )

      // Resources outside the apps API group remain unaffected.
      await waitForIndexed(
        token,
        itemFilters({ kind: 'ConfigMap', namespace: ns, name: 'kube-root-ca.crt' }),
        {},
        { timeout: 120000 }
      )
    } finally {
      deleteResource('statefulset', stsName, ns)
      deleteResource('deployment', deployName, ns)
      deleteResource('namespace', ns)
      deleteCollectorConfig(acmNamespace, userName)
    }
  }, 240000)

  // ACM-35522 - RHACM4K-65311
  test(`[P2][Sev2][${squad}] ACM-35522: should validate user excludes dynamically as integration config changes`, async () => {
    const integrationName = 'test-integration-config'
    const userName = 'user-collector-config'
    const operatorSA = `system:serviceaccount:${acmNamespace}:search-v2-operator`
    // Unique namespace per run to avoid collisions with stale Search records from previous runs
    const ns = `collector-dynamic-${Date.now().toString(36)}`
    const deployName = 'dynamic-test-deployment'
    const deployName2 = 'dynamic-test-deployment-excluded'
    const appsWildcardExclude = [{ action: 'exclude', resourceSelector: { apiGroups: ['apps'], kinds: ['*'] } }]
    const deployFilter = (name) => itemFilters({ kind: 'Deployment', apigroup: 'apps', namespace: ns, name })
    const includesDeployment = (r) => matchesRule(r, { action: 'include', apiGroup: 'apps', kind: 'Deployment' })

    try {
      applyIntegrationCollectorConfig(acmNamespace, integrationName, [
        { action: 'include', resourceSelector: { apiGroups: ['apps'], kinds: ['Deployment'] } },
      ])
      await waitForMergedRule(acmNamespace, includesDeployment)
      applyResource({ apiVersion: 'v1', kind: 'Namespace', metadata: { name: ns } })
      applyResource(makeDeployment(ns, deployName))
      await waitForIndexed(token, deployFilter(deployName), {}, { timeout: 120000 })

      // Overlapping user excludes are rejected while the integration include is active.
      expect(() =>
        applyCollectorConfig(
          acmNamespace,
          userName,
          [{ action: 'exclude', resourceSelector: { apiGroups: ['apps'], kinds: ['Deployment'] } }],
          { silent: true }
        )
      ).toThrow(webhookDenied)
      expect(() => applyCollectorConfig(acmNamespace, userName, appsWildcardExclude, { silent: true })).toThrow(
        webhookDenied
      )

      // Delete while still watched to avoid leaving a stale Search record after exclusion.
      deleteResource('deployment', deployName, ns)
      await waitForCondition(async () => (await searchItems(token, deployFilter(deployName))).length === 0, {
        timeout: 120000,
      })
      deleteCollectorConfig(acmNamespace, integrationName, { asServiceAccount: operatorSA })
      await waitForMergedRule(acmNamespace, includesDeployment, { present: false })

      // The same user exclude is now accepted.
      expect(() => applyCollectorConfig(acmNamespace, userName, appsWildcardExclude)).not.toThrow()
      await waitForMergedRule(acmNamespace, (r) => matchesRule(r, { action: 'exclude', apiGroup: 'apps', kind: '*' }))

      applyResource(makeDeployment(ns, deployName2))
      await expectRemainsUnindexed(token, deployFilter(deployName2))
    } finally {
      deleteResource('deployment', deployName2, ns)
      deleteResource('deployment', deployName, ns)
      deleteResource('namespace', ns)
      deleteCollectorConfig(acmNamespace, userName)
      deleteCollectorConfig(acmNamespace, integrationName, { asServiceAccount: operatorSA })
    }
  }, 360000)
})
