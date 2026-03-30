// Copyright Contributors to the Open Cluster Management project

// Test wildcard (*) support in streaming subscription filters (ACM-27856).
// PR: https://github.com/stolostron/search-v2-api/pull/704

const squad = require('../../config').get('squadName')

const { execCliCmdString } = require('../common-lib/cliClient')
const { getKubeadminToken, getSearchApiRoute } = require('../common-lib/clusterAccess')
const { createWebSocket } = require('../common-lib/websocketHelper')

let token = ''
let websocketUrl = ''

const WATCH_QUERY =
  'subscription watch($input: SearchInput) { watch(input: $input) { uid operation newData oldData timestamp } }'
const TEST_TIMEOUT = 15000

function buildSubscribeMsg(id, filters) {
  return JSON.stringify({
    id,
    type: 'subscribe',
    payload: {
      query: WATCH_QUERY,
      variables: { input: { keywords: [], filters } },
      operationName: 'watch',
    },
  })
}

async function waitFor(condition, timeoutMs = 10000, intervalMs = 50) {
  const start = Date.now()
  while (!condition()) {
    if (Date.now() - start > timeoutMs) return false
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
  return true
}

describe(`[P2][Sev2][${squad}] ACM-27856: Subscription API - Wildcard Filter Support`, () => {
  beforeAll(async () => {
    token = getKubeadminToken()
    const searchApiRoute = await getSearchApiRoute()
    websocketUrl = searchApiRoute.replace('https://', 'wss://')
  })

  afterAll(async () => {
    await execCliCmdString(`
      oc delete configmap test-wc-alpha -n default --ignore-not-found
      oc delete configmap test-wc-beta -n default --ignore-not-found
      oc delete configmap test-wc-other -n default --ignore-not-found
      oc delete configmap wc-suffix-test -n default --ignore-not-found
      oc delete configmap wc-contains-wildcard-cm -n default --ignore-not-found
      oc delete configmap wc-kind-test -n default --ignore-not-found
      oc delete configmap wc-case-test -n default --ignore-not-found
    `)
  })

  it(
    'should receive events matching a prefix wildcard filter on name (test-wc-*)',
    async () => {
      let matchCount = 0
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (
          eventData.type === 'next' &&
          event.data.includes('INSERT') &&
          (event.data.includes('test-wc-alpha') || event.data.includes('test-wc-beta'))
        ) {
          matchCount++
        }
      }

      ws.send(
        buildSubscribeMsg('wc-0001', [
          { property: 'kind', values: ['ConfigMap'] },
          { property: 'name', values: ['test-wc-*'] },
        ])
      )

      await new Promise((resolve) => setTimeout(resolve, 100))

      await execCliCmdString('oc create configmap test-wc-alpha -n default')
      await execCliCmdString('oc create configmap test-wc-beta -n default')

      const received = await waitFor(() => matchCount >= 2)
      expect(received).toBe(true)
      expect(matchCount).toBeGreaterThanOrEqual(2)
      ws.close()
    },
    TEST_TIMEOUT
  )

  it(
    'should NOT receive events for resources that do not match the wildcard filter',
    async () => {
      let gotUnexpected = false
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        // Subscribe to 'prefix-wc-*' — 'test-wc-other' should not match.
        if (eventData.type === 'next' && event.data.includes('INSERT') && event.data.includes('test-wc-other')) {
          gotUnexpected = true
        }
      }

      ws.send(
        buildSubscribeMsg('wc-0002', [
          { property: 'kind', values: ['ConfigMap'] },
          { property: 'name', values: ['prefix-wc-*'] },
        ])
      )

      await new Promise((resolve) => setTimeout(resolve, 100))
      await execCliCmdString('oc create configmap test-wc-other -n default')

      // Wait long enough to confirm no matching event is delivered.
      await new Promise((resolve) => setTimeout(resolve, 3000))
      expect(gotUnexpected).toBe(false)
      ws.close()
    },
    TEST_TIMEOUT
  )

  it(
    'should receive events matching a suffix wildcard filter on name (*-test)',
    async () => {
      let gotMatch = false
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (eventData.type === 'next' && event.data.includes('INSERT') && event.data.includes('wc-suffix-test')) {
          gotMatch = true
        }
      }

      ws.send(
        buildSubscribeMsg('wc-0003', [
          { property: 'kind', values: ['ConfigMap'] },
          { property: 'name', values: ['*-test'] },
        ])
      )

      await new Promise((resolve) => setTimeout(resolve, 100))
      await execCliCmdString('oc create configmap wc-suffix-test -n default')

      const received = await waitFor(() => gotMatch)
      expect(received).toBe(true)
      ws.close()
    },
    TEST_TIMEOUT
  )

  it(
    'should receive events matching a contains wildcard filter on name (*wildcard*)',
    async () => {
      let gotMatch = false
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (
          eventData.type === 'next' &&
          event.data.includes('INSERT') &&
          event.data.includes('wc-contains-wildcard-cm')
        ) {
          gotMatch = true
        }
      }

      ws.send(
        buildSubscribeMsg('wc-0004', [
          { property: 'kind', values: ['ConfigMap'] },
          { property: 'name', values: ['*wildcard*'] },
        ])
      )

      await new Promise((resolve) => setTimeout(resolve, 100))
      await execCliCmdString('oc create configmap wc-contains-wildcard-cm -n default')

      const received = await waitFor(() => gotMatch)
      expect(received).toBe(true)
      ws.close()
    },
    TEST_TIMEOUT
  )

  it(
    'should receive events when kind filter uses a wildcard (ConfigMap*)',
    async () => {
      let gotMatch = false
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (eventData.type === 'next' && event.data.includes('INSERT') && event.data.includes('wc-kind-test')) {
          gotMatch = true
        }
      }

      ws.send(
        buildSubscribeMsg('wc-0005', [
          { property: 'kind', values: ['ConfigMap*'] },
          { property: 'name', values: ['wc-kind-test'] },
        ])
      )

      await new Promise((resolve) => setTimeout(resolve, 100))
      await execCliCmdString('oc create configmap wc-kind-test -n default')

      const received = await waitFor(() => gotMatch)
      expect(received).toBe(true)
      ws.close()
    },
    TEST_TIMEOUT
  )

  it(
    'wildcard matching is case-sensitive: configmap* should NOT match kind=ConfigMap',
    async () => {
      let gotMatch = false
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (eventData.type === 'next' && event.data.includes('INSERT') && event.data.includes('wc-case-test')) {
          gotMatch = true
        }
      }

      // 'configmap*' (all lowercase) should NOT match kind 'ConfigMap' (mixed case).
      ws.send(
        buildSubscribeMsg('wc-0006', [
          { property: 'kind', values: ['configmap*'] },
          { property: 'name', values: ['wc-case-test'] },
        ])
      )

      await new Promise((resolve) => setTimeout(resolve, 100))
      await execCliCmdString('oc create configmap wc-case-test -n default')

      // Wait to confirm no event arrives for the case-mismatched filter.
      await new Promise((resolve) => setTimeout(resolve, 3000))
      expect(gotMatch).toBe(false)
      ws.close()
    },
    TEST_TIMEOUT
  )
})
