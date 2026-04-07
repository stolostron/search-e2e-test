// Copyright Contributors to the Open Cluster Management project

// Test subscription API comparison operators.
// Tests the comparison operators feature added in PR #705

const squad = require('../../config').get('squadName')

const { execCliCmdString } = require('../common-lib/cliClient')
const { getKubeadminToken, getSearchApiRoute } = require('../common-lib/clusterAccess')
const { createWebSocket } = require('../common-lib/websocketHelper')
const { waitFor } = require('../common-lib')

let websocketUrl = ''
let token = ''
const testNamespace = `automation-subscription-operators-${Date.now()}`

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
        const received = await waitFor(() => receivedInsert)
        expect(received).toBe(true)
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
        const received = await waitFor(() => receivedInsert, 15000)
        expect(received).toBe(true)
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
        const received = await waitFor(() => receivedInsert, 15000)
        expect(received).toBe(true)
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

        const received = await waitFor(() => receivedCorrectCM, 8000)
        expect(received).toBe(true)
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

        const received = await waitFor(() => receivedCorrectCM, 8000)
        expect(received).toBe(true)
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
        const received = await waitFor(() => receivedSecret, 15000)
        expect(received).toBe(true)
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
      let received2rep = false // Boundary proof: must stay false — 2 is not >2
      let received3rep = false
      let received5rep = false
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (eventData.type !== 'next') return
        const watch = eventData?.payload?.data?.watch
        if (!watch || watch.operation !== 'UPDATE') return
        let newData
        try {
          newData = JSON.parse(watch.newData)
        } catch {
          return
        }
        const desired = Number(newData?.desired)
        // Track any 2rep event to detect server-side filter regression (2 is not >2)
        if (newData?.name === 'test-deploy-2rep') received2rep = true
        // Exact target values to avoid false positives from late beforeEach baseline events
        if (newData?.name === 'test-deploy-3rep' && desired === 4) received3rep = true
        if (newData?.name === 'test-deploy-5rep' && desired === 6) received5rep = true
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

        // Boundary proof: scale 2rep to trigger UPDATEs at the cutoff (desired=2) and below (desired=1)
        // The subscription filter >2 must exclude both; if server wrongly applies >=2, received2rep flips.
        await execCliCmdString(`oc scale deployment test-deploy-2rep -n ${testNamespace} --replicas=1`)
        await execCliCmdString(`oc scale deployment test-deploy-2rep -n ${testNamespace} --replicas=2`)
        await settleMs()
        expect(received2rep).toBe(false) // Strict boundary: 2 is not >2

        // Scale 3rep 3→4 and 5rep 5→6: both are >2, both UPDATEs must be received
        await execCliCmdString(`oc scale deployment test-deploy-3rep -n ${testNamespace} --replicas=4`)
        await execCliCmdString(`oc scale deployment test-deploy-5rep -n ${testNamespace} --replicas=6`)

        const receivedUpdates = await waitFor(() => received3rep && received5rep, 15000)
        expect(receivedUpdates).toBe(true)
        expect(received3rep).toBe(true)
        expect(received5rep).toBe(true)
      } finally {
        ws.close()
      }
    }, 35000)

    it('should filter with >= operator for numeric values', async () => {
      let received2rep = false // Boundary proof: must stay false — 2 is not >=3
      let received3rep = false
      let received5rep = false
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (eventData.type !== 'next') return
        const watch = eventData?.payload?.data?.watch
        if (!watch || watch.operation !== 'UPDATE') return
        let newData
        try {
          newData = JSON.parse(watch.newData)
        } catch {
          return
        }
        const desired = Number(newData?.desired)
        // Track any 2rep event to detect regression (2 is not >=3)
        if (newData?.name === 'test-deploy-2rep') received2rep = true
        // Exact target values to avoid false positives from late beforeEach baseline events
        if (newData?.name === 'test-deploy-3rep' && desired === 5) received3rep = true
        if (newData?.name === 'test-deploy-5rep' && desired === 7) received5rep = true
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

        // Boundary proof: scale 2rep (baseline=2) down to 1 — neither 1 nor 2 is >=3
        await execCliCmdString(`oc scale deployment test-deploy-2rep -n ${testNamespace} --replicas=1`)
        await settleMs()
        expect(received2rep).toBe(false) // Strict boundary: values <3 must be excluded

        // Scale 3rep 3→5 and 5rep 5→7: both >=3, both UPDATEs must be received
        await execCliCmdString(`oc scale deployment test-deploy-3rep -n ${testNamespace} --replicas=5`)
        await execCliCmdString(`oc scale deployment test-deploy-5rep -n ${testNamespace} --replicas=7`)

        const receivedUpdates = await waitFor(() => received3rep && received5rep, 15000)
        expect(receivedUpdates).toBe(true)
        expect(received3rep).toBe(true)
        expect(received5rep).toBe(true)
      } finally {
        ws.close()
      }
    }, 30000)

    it('should filter with < operator for numeric values', async () => {
      let received2rep = false
      let received3rep = false
      let received5rep = false // Boundary proof: must stay false — 5 (and 6) are not <5
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (eventData.type !== 'next') return
        const watch = eventData?.payload?.data?.watch
        if (!watch || watch.operation !== 'UPDATE') return
        let newData
        try {
          newData = JSON.parse(watch.newData)
        } catch {
          return
        }
        const desired = Number(newData?.desired)
        // Exact target values to avoid false positives from late beforeEach baseline events
        if (newData?.name === 'test-deploy-2rep' && desired === 3) received2rep = true
        if (newData?.name === 'test-deploy-3rep' && desired === 4) received3rep = true
        // Track any 5rep event to detect regression (5 and 6 are not <5)
        if (newData?.name === 'test-deploy-5rep') received5rep = true
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

        // Boundary proof: scale 5rep through 6 (>5) then back to 5 (=cutoff) — neither is <5
        // If server wrongly treats <5 as <=5, it would send the UPDATE at desired=5.
        await execCliCmdString(`oc scale deployment test-deploy-5rep -n ${testNamespace} --replicas=6`)
        await execCliCmdString(`oc scale deployment test-deploy-5rep -n ${testNamespace} --replicas=5`)
        await settleMs()
        expect(received5rep).toBe(false) // Strict boundary: 5 (and 6) are not <5

        // Scale 2rep 2→3 and 3rep 3→4: both <5, both UPDATEs must be received
        await execCliCmdString(`oc scale deployment test-deploy-2rep -n ${testNamespace} --replicas=3`)
        await execCliCmdString(`oc scale deployment test-deploy-3rep -n ${testNamespace} --replicas=4`)

        const receivedUpdates = await waitFor(() => received2rep && received3rep, 15000)
        expect(receivedUpdates).toBe(true)
        expect(received2rep).toBe(true)
        expect(received3rep).toBe(true)
      } finally {
        ws.close()
      }
    }, 30000)

    it('should filter with <= operator for numeric values', async () => {
      let received2rep = false
      let received5rep = false
      let receivedExclusion = false // Boundary proof: 5rep at desired=4 must stay false — 4 is not <=3
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (eventData.type !== 'next') return
        const watch = eventData?.payload?.data?.watch
        if (!watch || watch.operation !== 'UPDATE') return
        let newData
        try {
          newData = JSON.parse(watch.newData)
        } catch {
          return
        }
        const desired = Number(newData?.desired)
        // Exact target values to avoid false positives from late beforeEach baseline events
        if (newData?.name === 'test-deploy-2rep' && desired === 3) received2rep = true
        if (newData?.name === 'test-deploy-5rep' && desired === 3) received5rep = true
        // Boundary proof: 5rep scaled to 4 must NOT be received (4 > 3)
        if (newData?.name === 'test-deploy-5rep' && desired === 4) receivedExclusion = true
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

        // Boundary proof: scale 5rep 5→4 — desired=4 is not <=3, must not be received
        await execCliCmdString(`oc scale deployment test-deploy-5rep -n ${testNamespace} --replicas=4`)
        await settleMs()
        expect(receivedExclusion).toBe(false) // Strict boundary: 4 is not <=3

        // Scale 2rep 2→3 (<=3) and 5rep 4→3 (<=3): both UPDATEs must be received
        await execCliCmdString(`oc scale deployment test-deploy-2rep -n ${testNamespace} --replicas=3`)
        await execCliCmdString(`oc scale deployment test-deploy-5rep -n ${testNamespace} --replicas=3`)

        const receivedUpdates = await waitFor(() => received2rep && received5rep, 15000)
        expect(receivedUpdates).toBe(true)
        expect(received2rep).toBe(true)
        expect(received5rep).toBe(true)
      } finally {
        ws.close()
      }
    }, 30000)
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
      let receivedAlpha = false // Boundary proof: must stay false — "test-alpha" is not >"test-alpha"
      let receivedBeta = false
      let receivedGamma = false
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (eventData.type === 'next' && event.data.includes('INSERT')) {
          // Independent ifs so all matching names are captured in one event
          if (event.data.includes('"test-alpha"')) receivedAlpha = true
          if (event.data.includes('"test-beta"')) receivedBeta = true
          if (event.data.includes('"test-gamma"')) receivedGamma = true
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

        // Boundary proof: recreate test-alpha — "test-alpha" is the cutoff, not >"test-alpha"
        await execCliCmdString(`oc delete configmap test-alpha -n ${testNamespace} --ignore-not-found=true`)
        await execCliCmdString(`oc create configmap test-alpha -n ${testNamespace}`)
        await settleMs()
        expect(receivedAlpha).toBe(false) // Strict boundary: "test-alpha" is not >"test-alpha"

        // Recreate test-beta and test-gamma to trigger INSERTs that satisfy >test-alpha
        await execCliCmdString(`oc delete configmap test-beta test-gamma -n ${testNamespace} --ignore-not-found=true`)
        await execCliCmdString(`oc create configmap test-beta -n ${testNamespace}`)
        await execCliCmdString(`oc create configmap test-gamma -n ${testNamespace}`)

        const receivedUpdates = await waitFor(() => receivedBeta && receivedGamma, 10000)
        expect(receivedUpdates).toBe(true)
        expect(receivedBeta).toBe(true)
        expect(receivedGamma).toBe(true)
      } finally {
        ws.close()
      }
    }, 20000)

    it('should filter with < operator for string values (lexicographic)', async () => {
      let receivedAlpha = false
      let receivedBeta = false // Boundary proof: must stay false — "test-beta" is not <"test-beta"
      let receivedGamma = false // Boundary proof: must stay false — "test-gamma" > "test-beta"
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (eventData.type === 'next' && event.data.includes('INSERT')) {
          if (event.data.includes('"test-alpha"')) receivedAlpha = true
          if (event.data.includes('"test-beta"')) receivedBeta = true
          if (event.data.includes('"test-gamma"')) receivedGamma = true
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

        // Boundary proof: recreate test-beta and test-gamma — both are >=test-beta, must be excluded
        await execCliCmdString(`oc delete configmap test-beta test-gamma -n ${testNamespace} --ignore-not-found=true`)
        await execCliCmdString(`oc create configmap test-beta -n ${testNamespace}`)
        await execCliCmdString(`oc create configmap test-gamma -n ${testNamespace}`)
        await settleMs()
        expect(receivedBeta).toBe(false) // Strict boundary: "test-beta" is not <"test-beta"
        expect(receivedGamma).toBe(false) // "test-gamma" > "test-beta", also excluded

        // Recreate test-alpha to trigger INSERT that satisfies <test-beta
        await execCliCmdString(`oc delete configmap test-alpha -n ${testNamespace} --ignore-not-found=true`)
        await execCliCmdString(`oc create configmap test-alpha -n ${testNamespace}`)

        const received = await waitFor(() => receivedAlpha, 10000)
        expect(received).toBe(true)
        expect(receivedAlpha).toBe(true)
      } finally {
        ws.close()
      }
    }, 20000)
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
        const received = await waitFor(() => receivedCM)
        expect(received).toBe(true)
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

        // test-cm-wildcard-nomatch: name starts with "test-cm-wildcard-" (matches the wildcard pattern)
        // If != wrongly applied wildcard semantics, this CM would be EXCLUDED (name matches pattern) — receivedAnyCM stays false.
        await execCliCmdString(`oc create configmap test-cm-wildcard-nomatch -n ${testNamespace}`)

        // test-cm-no-wildcard: name does NOT match "test-cm-wildcard-*".
        // If != wrongly applied wildcard semantics, this CM would be INCLUDED (name doesn't match pattern) — receivedAnyCM flips to true.
        // This second CM is the critical falsification test for wrong wildcard-with-!= behavior.
        await execCliCmdString(`oc create configmap test-cm-no-wildcard -n ${testNamespace}`)

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
