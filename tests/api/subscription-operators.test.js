// Copyright Contributors to the Open Cluster Management project

// Test subscription API comparison operators.
// Tests the comparison operators feature added in PR #705

const squad = require('../../config').get('squadName')

const { execCliCmdString } = require('../common-lib/cliClient')
const { getKubeadminToken, getSearchApiRoute } = require('../common-lib/clusterAccess')
const { createWebSocket } = require('../common-lib/websocketHelper')

let websocketUrl = ''
let token = ''
const testNamespace = 'automation-subscription-operators'

// Helper function for bounded waiting with timeout
async function waitFor(predicate, timeoutMs = 5000, intervalMs = 50) {
  const deadline = Date.now() + timeoutMs
  while (!predicate()) {
    if (Date.now() > deadline) {
      throw new Error('Timed out waiting for condition')
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
}

/** Short pause so late subscription events can arrive before asserting negatives. */
async function settleMs(ms = 300) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

describe(`[P2][Sev2][${squad}] ACM-27847: Subscription API Comparison Operators`, () => {
  beforeAll(async () => {
    // Log in and get access token
    token = getKubeadminToken()

    // Create a route to access the Search API.
    const searchApiRoute = await getSearchApiRoute()
    websocketUrl = searchApiRoute.replace('https://', 'wss://')

    // Create test namespace
    await execCliCmdString(`oc create namespace ${testNamespace}`)
  }, 15000)

  describe('Equality operators', () => {
    it('should filter with default equality operator (=)', async () => {
      let receivedInsert = false
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (eventData.type === 'next' && event.data.includes('INSERT') && event.data.includes('test-cm-equality')) {
          receivedInsert = true
        }
      }

      // Subscribe with equality filter (no operator prefix, defaults to =)
      ws.send(
        JSON.stringify({
          id: '0001',
          type: 'subscribe',
          payload: {
            query:
              'subscription watch($input: SearchInput) { watch(input: $input) { uid operation newData oldData timestamp } }',
            variables: {
              input: {
                keywords: [],
                filters: [
                  { property: 'kind', values: ['ConfigMap'] },
                  { property: 'namespace', values: [testNamespace] },
                  { property: 'name', values: ['test-cm-equality'] },
                ],
              },
            },
            operationName: 'watch',
          },
        })
      )

      try {
        await new Promise((resolve) => setTimeout(resolve, 50))
        await execCliCmdString(`oc create configmap test-cm-equality -n ${testNamespace}`)
        await waitFor(() => receivedInsert)
        expect(receivedInsert).toBe(true)
      } finally {
        ws.close()
      }
    }, 11000)

    it('should filter with explicit equality operator (=value)', async () => {
      let receivedInsert = false
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (eventData.type === 'next' && event.data.includes('INSERT') && event.data.includes('test-cm-explicit-eq')) {
          receivedInsert = true
        }
      }

      // Subscribe with explicit = operator
      ws.send(
        JSON.stringify({
          id: '0002',
          type: 'subscribe',
          payload: {
            query:
              'subscription watch($input: SearchInput) { watch(input: $input) { uid operation newData oldData timestamp } }',
            variables: {
              input: {
                keywords: [],
                filters: [
                  { property: 'kind', values: ['=ConfigMap'] },
                  { property: 'namespace', values: [testNamespace] },
                  { property: 'name', values: ['=test-cm-explicit-eq'] },
                ],
              },
            },
            operationName: 'watch',
          },
        })
      )

      try {
        await new Promise((resolve) => setTimeout(resolve, 50))
        await execCliCmdString(`oc create configmap test-cm-explicit-eq -n ${testNamespace}`)
        await waitFor(() => receivedInsert, 15000)
        expect(receivedInsert).toBe(true)
      } finally {
        ws.close()
      }
    }, 20000)

    it('should match kind case-insensitively with equality operator', async () => {
      let receivedInsert = false
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (eventData.type === 'next' && event.data.includes('INSERT') && event.data.includes('test-cm-case')) {
          receivedInsert = true
        }
      }

      // Subscribe with lowercase kind filter
      ws.send(
        JSON.stringify({
          id: '0003',
          type: 'subscribe',
          payload: {
            query:
              'subscription watch($input: SearchInput) { watch(input: $input) { uid operation newData oldData timestamp } }',
            variables: {
              input: {
                keywords: [],
                filters: [
                  { property: 'kind', values: ['configmap'] }, // lowercase
                  { property: 'namespace', values: [testNamespace] },
                  { property: 'name', values: ['test-cm-case'] },
                ],
              },
            },
            operationName: 'watch',
          },
        })
      )

      try {
        await new Promise((resolve) => setTimeout(resolve, 50))
        await execCliCmdString(`oc create configmap test-cm-case -n ${testNamespace}`)
        await waitFor(() => receivedInsert, 15000)
        expect(receivedInsert).toBe(true)
      } finally {
        ws.close()
      }
    }, 20000)
  })

  describe('Not equal operators', () => {
    it('should filter with != operator', async () => {
      let receivedWrongCM = false
      let receivedCorrectCM = false
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (eventData.type === 'next' && event.data.includes('INSERT')) {
          if (event.data.includes('test-cm-not-equal-1')) {
            receivedWrongCM = true
          } else if (event.data.includes('test-cm-not-equal-2')) {
            receivedCorrectCM = true
          }
        }
      }

      // Subscribe with != operator - should NOT match test-cm-not-equal-1
      ws.send(
        JSON.stringify({
          id: '0004',
          type: 'subscribe',
          payload: {
            query:
              'subscription watch($input: SearchInput) { watch(input: $input) { uid operation newData oldData timestamp } }',
            variables: {
              input: {
                keywords: [],
                filters: [
                  { property: 'kind', values: ['ConfigMap'] },
                  { property: 'namespace', values: [testNamespace] },
                  { property: 'name', values: ['!=test-cm-not-equal-1'] },
                ],
              },
            },
            operationName: 'watch',
          },
        })
      )

      try {
        await new Promise((resolve) => setTimeout(resolve, 50))
        await execCliCmdString(`oc create configmap test-cm-not-equal-1 -n ${testNamespace}`)
        await execCliCmdString(`oc create configmap test-cm-not-equal-2 -n ${testNamespace}`)

        await waitFor(() => receivedCorrectCM, 8000)
        await settleMs()
        expect(receivedWrongCM).toBe(false) // Should NOT receive the excluded CM
        expect(receivedCorrectCM).toBe(true) // Should receive other CMs
      } finally {
        ws.close()
      }
    }, 16000)

    it('should filter with ! operator', async () => {
      let receivedWrongCM = false
      let receivedCorrectCM = false
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (eventData.type === 'next' && event.data.includes('INSERT')) {
          if (event.data.includes('test-cm-bang-1')) {
            receivedWrongCM = true
          } else if (event.data.includes('test-cm-bang-2')) {
            receivedCorrectCM = true
          }
        }
      }

      // Subscribe with ! operator (shorter form of !=)
      ws.send(
        JSON.stringify({
          id: '0005',
          type: 'subscribe',
          payload: {
            query:
              'subscription watch($input: SearchInput) { watch(input: $input) { uid operation newData oldData timestamp } }',
            variables: {
              input: {
                keywords: [],
                filters: [
                  { property: 'kind', values: ['ConfigMap'] },
                  { property: 'namespace', values: [testNamespace] },
                  { property: 'name', values: ['!test-cm-bang-1'] },
                ],
              },
            },
            operationName: 'watch',
          },
        })
      )

      try {
        await new Promise((resolve) => setTimeout(resolve, 50))
        await execCliCmdString(`oc create configmap test-cm-bang-1 -n ${testNamespace}`)
        await execCliCmdString(`oc create configmap test-cm-bang-2 -n ${testNamespace}`)

        await waitFor(() => receivedCorrectCM, 8000)
        await settleMs()
        expect(receivedWrongCM).toBe(false)
        expect(receivedCorrectCM).toBe(true)
      } finally {
        ws.close()
      }
    }, 16000)

    it('should match kind case-insensitively with != operator', async () => {
      let receivedSecret = false
      let receivedConfigMapProof = false
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        const op = event.data.includes('INSERT') || event.data.includes('UPDATE')
        if (eventData.type === 'next' && op) {
          if (event.data.includes('test-cm-ne-kind-proof')) {
            receivedConfigMapProof = true
          }
          if (event.data.includes('test-secret-ne')) {
            receivedSecret = true
          }
        }
      }

      // Subscribe with != for kind (case-insensitive)
      ws.send(
        JSON.stringify({
          id: '0006',
          type: 'subscribe',
          payload: {
            query:
              'subscription watch($input: SearchInput) { watch(input: $input) { uid operation newData oldData timestamp } }',
            variables: {
              input: {
                keywords: [],
                filters: [
                  { property: 'kind', values: ['!=configmap'] }, // Should exclude ConfigMap (case-insensitive)
                  { property: 'namespace', values: [testNamespace] },
                ],
              },
            },
            operationName: 'watch',
          },
        })
      )

      try {
        await new Promise((resolve) => setTimeout(resolve, 50))
        await execCliCmdString(`oc create configmap test-cm-ne-kind-proof -n ${testNamespace} --from-literal=k=v`)
        await execCliCmdString(`oc create secret generic test-secret-ne -n ${testNamespace} --from-literal=key=value`)
        await waitFor(() => receivedSecret, 15000)
        await settleMs()
        expect(receivedConfigMapProof).toBe(false)
        expect(receivedSecret).toBe(true)
      } finally {
        ws.close()
      }
    }, 20000)
  })

  describe('Numeric comparison operators', () => {
    beforeAll(async () => {
      // Create Deployments with different replica counts for numeric testing
      await execCliCmdString(
        `oc create deployment test-deploy-2rep --image=registry.access.redhat.com/ubi8/ubi-minimal:latest -n ${testNamespace} --replicas=2`
      )
      await execCliCmdString(
        `oc create deployment test-deploy-3rep --image=registry.access.redhat.com/ubi8/ubi-minimal:latest -n ${testNamespace} --replicas=3`
      )
      await execCliCmdString(
        `oc create deployment test-deploy-5rep --image=registry.access.redhat.com/ubi8/ubi-minimal:latest -n ${testNamespace} --replicas=5`
      )

      // Wait for resources to be indexed
      await new Promise((resolve) => setTimeout(resolve, 10000))
    }, 40000)

    beforeEach(async () => {
      // Deterministic baseline for each relational test (avoids order-dependent replica counts)
      await execCliCmdString(`oc scale deployment test-deploy-2rep -n ${testNamespace} --replicas=2`)
      await execCliCmdString(`oc scale deployment test-deploy-3rep -n ${testNamespace} --replicas=3`)
      await execCliCmdString(`oc scale deployment test-deploy-5rep -n ${testNamespace} --replicas=5`)
      await new Promise((resolve) => setTimeout(resolve, 3000))
    }, 60000)

    it('should filter with > operator for numeric values', async () => {
      let received3rep = false
      let received5rep = false
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        // Scaling emits UPDATE, not INSERT (align with >= test handler).
        if (eventData.type === 'next' && event.data.includes('Deployment')) {
          if (event.data.includes('test-deploy-3rep')) {
            received3rep = true
          }
          if (event.data.includes('test-deploy-5rep')) {
            received5rep = true
          }
        }
      }

      // Subscribe with > operator - should match replicas > 2
      ws.send(
        JSON.stringify({
          id: '0007',
          type: 'subscribe',
          payload: {
            query:
              'subscription watch($input: SearchInput) { watch(input: $input) { uid operation newData oldData timestamp } }',
            variables: {
              input: {
                keywords: [],
                filters: [
                  { property: 'kind', values: ['Deployment'] },
                  { property: 'namespace', values: [testNamespace] },
                  { property: 'desired', values: ['>2'] },
                ],
              },
            },
            operationName: 'watch',
          },
        })
      )

      try {
        await new Promise((resolve) => setTimeout(resolve, 50))

        // Baseline 2,3,5 from beforeEach — scale so desired > 2 and UPDATEs fire
        await execCliCmdString(`oc scale deployment test-deploy-3rep -n ${testNamespace} --replicas=4`)
        await execCliCmdString(`oc scale deployment test-deploy-5rep -n ${testNamespace} --replicas=6`)

        await new Promise((resolve) => setTimeout(resolve, 5000))

        expect(received3rep).toBe(true)
        expect(received5rep).toBe(true)
      } finally {
        ws.close()
      }
    }, 25000)

    it('should filter with >= operator for numeric values', async () => {
      let received3rep = false
      let received5rep = false
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (eventData.type === 'next' && event.data.includes('Deployment')) {
          if (event.data.includes('test-deploy-3rep')) {
            received3rep = true
          }
          if (event.data.includes('test-deploy-5rep')) {
            received5rep = true
          }
        }
      }

      // Subscribe with >= operator - should match desired >= 3
      ws.send(
        JSON.stringify({
          id: '0008',
          type: 'subscribe',
          payload: {
            query:
              'subscription watch($input: SearchInput) { watch(input: $input) { uid operation newData oldData timestamp } }',
            variables: {
              input: {
                keywords: [],
                filters: [
                  { property: 'kind', values: ['Deployment'] },
                  { property: 'namespace', values: [testNamespace] },
                  { property: 'desired', values: ['>=3'] },
                ],
              },
            },
            operationName: 'watch',
          },
        })
      )

      try {
        await new Promise((resolve) => setTimeout(resolve, 50))
        // Baseline 2,3,5 from beforeEach — scale so desired stays >= 3 and UPDATEs fire
        await execCliCmdString(`oc scale deployment test-deploy-3rep -n ${testNamespace} --replicas=5`)
        await execCliCmdString(`oc scale deployment test-deploy-5rep -n ${testNamespace} --replicas=7`)

        await waitFor(() => received3rep && received5rep, 15000)

        expect(received3rep).toBe(true)
        expect(received5rep).toBe(true)
      } finally {
        ws.close()
      }
    }, 25000)

    it('should filter with < operator for numeric values', async () => {
      let received2rep = false
      let received3rep = false
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (eventData.type === 'next' && event.data.includes('Deployment')) {
          if (event.data.includes('test-deploy-2rep')) {
            received2rep = true
          }
          if (event.data.includes('test-deploy-3rep')) {
            received3rep = true
          }
        }
      }

      // Subscribe with < operator - should match desired < 5
      ws.send(
        JSON.stringify({
          id: '0009',
          type: 'subscribe',
          payload: {
            query:
              'subscription watch($input: SearchInput) { watch(input: $input) { uid operation newData oldData timestamp } }',
            variables: {
              input: {
                keywords: [],
                filters: [
                  { property: 'kind', values: ['Deployment'] },
                  { property: 'namespace', values: [testNamespace] },
                  { property: 'desired', values: ['<5'] },
                ],
              },
            },
            operationName: 'watch',
          },
        })
      )

      try {
        await new Promise((resolve) => setTimeout(resolve, 50))
        // Baseline 2,3,5 — both targets stay < 5 and differ from baseline so UPDATEs fire
        await execCliCmdString(`oc scale deployment test-deploy-2rep -n ${testNamespace} --replicas=3`)
        await execCliCmdString(`oc scale deployment test-deploy-3rep -n ${testNamespace} --replicas=4`)

        await new Promise((resolve) => setTimeout(resolve, 5000))

        expect(received2rep).toBe(true)
        expect(received3rep).toBe(true)
      } finally {
        ws.close()
      }
    }, 25000)

    it('should filter with <= operator for numeric values', async () => {
      let received2rep = false
      let received3rep = false
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (eventData.type === 'next' && event.data.includes('Deployment')) {
          if (event.data.includes('test-deploy-2rep')) {
            received2rep = true
          }
          if (event.data.includes('test-deploy-3rep')) {
            received3rep = true
          }
        }
      }

      // Subscribe with <= operator - should match desired <= 3
      ws.send(
        JSON.stringify({
          id: '0010',
          type: 'subscribe',
          payload: {
            query:
              'subscription watch($input: SearchInput) { watch(input: $input) { uid operation newData oldData timestamp } }',
            variables: {
              input: {
                keywords: [],
                filters: [
                  { property: 'kind', values: ['Deployment'] },
                  { property: 'namespace', values: [testNamespace] },
                  { property: 'desired', values: ['<=3'] },
                ],
              },
            },
            operationName: 'watch',
          },
        })
      )

      try {
        await new Promise((resolve) => setTimeout(resolve, 50))
        // Baseline 2,3,5 — both targets <= 3 and both change (2→3, 5→3)
        await execCliCmdString(`oc scale deployment test-deploy-2rep -n ${testNamespace} --replicas=3`)
        await execCliCmdString(`oc scale deployment test-deploy-3rep -n ${testNamespace} --replicas=3`)

        await new Promise((resolve) => setTimeout(resolve, 5000))

        expect(received2rep).toBe(true)
        expect(received3rep).toBe(true)
      } finally {
        ws.close()
      }
    }, 25000)
  })

  describe('String (lexicographic) comparison operators', () => {
    beforeAll(async () => {
      // Create ConfigMaps with different names for lexicographic testing
      await execCliCmdString(`oc create configmap test-alpha -n ${testNamespace}`)
      await execCliCmdString(`oc create configmap test-beta -n ${testNamespace}`)
      await execCliCmdString(`oc create configmap test-gamma -n ${testNamespace}`)

      // Wait for resources to be indexed
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }, 30000)

    it('should filter with > operator for string values (lexicographic)', async () => {
      let receivedBeta = false
      let receivedGamma = false
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (eventData.type === 'next' && event.data.includes('INSERT')) {
          if (event.data.includes('test-beta')) {
            receivedBeta = true
          } else if (event.data.includes('test-gamma')) {
            receivedGamma = true
          }
        }
      }

      // Subscribe with > operator for strings - should match name > "test-alpha"
      ws.send(
        JSON.stringify({
          id: '0011',
          type: 'subscribe',
          payload: {
            query:
              'subscription watch($input: SearchInput) { watch(input: $input) { uid operation newData oldData timestamp } }',
            variables: {
              input: {
                keywords: [],
                filters: [
                  { property: 'kind', values: ['ConfigMap'] },
                  { property: 'namespace', values: [testNamespace] },
                  { property: 'name', values: ['>test-alpha'] },
                ],
              },
            },
            operationName: 'watch',
          },
        })
      )

      try {
        await new Promise((resolve) => setTimeout(resolve, 50))
        // Recreate to trigger INSERT events
        await execCliCmdString(`oc delete configmap test-beta test-gamma -n ${testNamespace} --ignore-not-found=true`)
        await execCliCmdString(`oc create configmap test-beta -n ${testNamespace}`)
        await execCliCmdString(`oc create configmap test-gamma -n ${testNamespace}`)

        await new Promise((resolve) => setTimeout(resolve, 5000))

        expect(receivedBeta).toBe(true)
        expect(receivedGamma).toBe(true)
      } finally {
        ws.close()
      }
    }, 15000)

    it('should filter with < operator for string values (lexicographic)', async () => {
      let receivedAlpha = false
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (eventData.type === 'next' && event.data.includes('INSERT') && event.data.includes('test-alpha')) {
          receivedAlpha = true
        }
      }

      // Subscribe with < operator for strings - should match name < "test-beta"
      ws.send(
        JSON.stringify({
          id: '0012',
          type: 'subscribe',
          payload: {
            query:
              'subscription watch($input: SearchInput) { watch(input: $input) { uid operation newData oldData timestamp } }',
            variables: {
              input: {
                keywords: [],
                filters: [
                  { property: 'kind', values: ['ConfigMap'] },
                  { property: 'namespace', values: [testNamespace] },
                  { property: 'name', values: ['<test-beta'] },
                ],
              },
            },
            operationName: 'watch',
          },
        })
      )

      try {
        await new Promise((resolve) => setTimeout(resolve, 50))
        await execCliCmdString(`oc delete configmap test-alpha -n ${testNamespace} --ignore-not-found=true`)
        await execCliCmdString(`oc create configmap test-alpha -n ${testNamespace}`)

        await new Promise((resolve) => setTimeout(resolve, 5000))

        expect(receivedAlpha).toBe(true)
      } finally {
        ws.close()
      }
    }, 15000)
  })

  describe('Wildcard behavior with operators', () => {
    it('should support wildcards only with equality operator', async () => {
      let receivedCM = false
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (
          eventData.type === 'next' &&
          event.data.includes('INSERT') &&
          event.data.includes('test-cm-wildcard-match')
        ) {
          receivedCM = true
        }
      }

      // Subscribe with wildcard (should work with = operator)
      ws.send(
        JSON.stringify({
          id: '0013',
          type: 'subscribe',
          payload: {
            query:
              'subscription watch($input: SearchInput) { watch(input: $input) { uid operation newData oldData timestamp } }',
            variables: {
              input: {
                keywords: [],
                filters: [
                  { property: 'kind', values: ['ConfigMap'] },
                  { property: 'namespace', values: [testNamespace] },
                  { property: 'name', values: ['test-cm-wildcard-*'] },
                ],
              },
            },
            operationName: 'watch',
          },
        })
      )

      try {
        await new Promise((resolve) => setTimeout(resolve, 50))
        await execCliCmdString(`oc create configmap test-cm-wildcard-match -n ${testNamespace}`)
        await waitFor(() => receivedCM)
        expect(receivedCM).toBe(true)
      } finally {
        ws.close()
      }
    }, 11000)

    it('should NOT support wildcards with != operator', async () => {
      let receivedAnyCM = false
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (eventData.type === 'next' && event.data.includes('INSERT')) {
          receivedAnyCM = true
        }
      }

      // Subscribe with wildcard and != operator (should NOT work)
      ws.send(
        JSON.stringify({
          id: '0014',
          type: 'subscribe',
          payload: {
            query:
              'subscription watch($input: SearchInput) { watch(input: $input) { uid operation newData oldData timestamp } }',
            variables: {
              input: {
                keywords: [],
                filters: [
                  { property: 'kind', values: ['ConfigMap'] },
                  { property: 'namespace', values: [testNamespace] },
                  { property: 'name', values: ['!=test-cm-wildcard-*'] },
                ],
              },
            },
            operationName: 'watch',
          },
        })
      )

      try {
        await new Promise((resolve) => setTimeout(resolve, 50))
        await execCliCmdString(`oc create configmap test-cm-wildcard-nomatch -n ${testNamespace}`)

        await new Promise((resolve) => setTimeout(resolve, 2000))

        // Should not receive any events because wildcard with != is not supported
        expect(receivedAnyCM).toBe(false)
      } finally {
        ws.close()
      }
    }, 11000)
  })

  afterAll(async () => {
    // Clean up test namespace (deletes all resources within it)
    await execCliCmdString(`oc delete namespace ${testNamespace} --ignore-not-found=true`)
  }, 60000)
})
