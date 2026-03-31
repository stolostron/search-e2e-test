// Copyright Contributors to the Open Cluster Management project

// Test subscription API comparison operators.
// Tests the comparison operators feature added in PR #705

const squad = require('../../config').get('squadName')

const { execCliCmdString } = require('../common-lib/cliClient')
const { getKubeadminToken, getSearchApiRoute } = require('../common-lib/clusterAccess')
const { createWebSocket } = require('../common-lib/websocketHelper')

let websocketUrl = ''
let token = ''

describe(`[P2][Sev2][${squad}] RHACM4K-XXXXX: Subscription API Comparison Operators`, () => {
  beforeAll(async () => {
    // Log in and get access token
    token = getKubeadminToken()

    // Create a route to access the Search API.
    const searchApiRoute = await getSearchApiRoute()
    websocketUrl = searchApiRoute.replace('https://', 'wss://')
  })

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
                  { property: 'name', values: ['test-cm-equality'] },
                ],
              },
            },
            operationName: 'watch',
          },
        })
      )

      await new Promise((resolve) => setTimeout(resolve, 50))
      await execCliCmdString('oc create configmap test-cm-equality -n default')

      while (!receivedInsert) {
        await new Promise((resolve) => setTimeout(resolve, 10))
      }

      expect(receivedInsert).toBe(true)
      ws.close()
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
                  { property: 'name', values: ['=test-cm-explicit-eq'] },
                ],
              },
            },
            operationName: 'watch',
          },
        })
      )

      await new Promise((resolve) => setTimeout(resolve, 50))
      await execCliCmdString('oc create configmap test-cm-explicit-eq -n default')

      while (!receivedInsert) {
        await new Promise((resolve) => setTimeout(resolve, 10))
      }

      expect(receivedInsert).toBe(true)
      ws.close()
    }, 11000)

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
                  { property: 'name', values: ['test-cm-case'] },
                ],
              },
            },
            operationName: 'watch',
          },
        })
      )

      await new Promise((resolve) => setTimeout(resolve, 50))
      await execCliCmdString('oc create configmap test-cm-case -n default')

      while (!receivedInsert) {
        await new Promise((resolve) => setTimeout(resolve, 10))
      }

      expect(receivedInsert).toBe(true)
      ws.close()
    }, 11000)
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
                  { property: 'name', values: ['!=test-cm-not-equal-1'] },
                ],
              },
            },
            operationName: 'watch',
          },
        })
      )

      await new Promise((resolve) => setTimeout(resolve, 50))
      await execCliCmdString('oc create configmap test-cm-not-equal-1 -n default')
      await execCliCmdString('oc create configmap test-cm-not-equal-2 -n default')

      // Wait to see if we receive the correct CM
      await new Promise((resolve) => setTimeout(resolve, 3000))

      expect(receivedWrongCM).toBe(false) // Should NOT receive the excluded CM
      expect(receivedCorrectCM).toBe(true) // Should receive other CMs
      ws.close()
    }, 11000)

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
                  { property: 'name', values: ['!test-cm-bang-1'] },
                ],
              },
            },
            operationName: 'watch',
          },
        })
      )

      await new Promise((resolve) => setTimeout(resolve, 50))
      await execCliCmdString('oc create configmap test-cm-bang-1 -n default')
      await execCliCmdString('oc create configmap test-cm-bang-2 -n default')

      await new Promise((resolve) => setTimeout(resolve, 3000))

      expect(receivedWrongCM).toBe(false)
      expect(receivedCorrectCM).toBe(true)
      ws.close()
    }, 11000)

    it('should match kind case-insensitively with != operator', async () => {
      let receivedSecret = false
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (eventData.type === 'next' && event.data.includes('INSERT') && event.data.includes('Secret')) {
          receivedSecret = true
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
                  { property: 'namespace', values: ['default'] },
                ],
              },
            },
            operationName: 'watch',
          },
        })
      )

      await new Promise((resolve) => setTimeout(resolve, 50))
      await execCliCmdString('oc create secret generic test-secret-ne -n default --from-literal=key=value')

      while (!receivedSecret) {
        await new Promise((resolve) => setTimeout(resolve, 10))
      }

      expect(receivedSecret).toBe(true)
      ws.close()
    }, 11000)
  })

  describe('Numeric comparison operators', () => {
    beforeAll(async () => {
      // Create Deployments with different replica counts for numeric testing
      await execCliCmdString(
        'oc create deployment test-deploy-2rep --image=registry.access.redhat.com/ubi8/ubi-minimal:latest -n default --replicas=2'
      )
      await execCliCmdString(
        'oc create deployment test-deploy-3rep --image=registry.access.redhat.com/ubi8/ubi-minimal:latest -n default --replicas=3'
      )
      await execCliCmdString(
        'oc create deployment test-deploy-5rep --image=registry.access.redhat.com/ubi8/ubi-minimal:latest -n default --replicas=5'
      )

      // Wait for resources to be indexed
      await new Promise((resolve) => setTimeout(resolve, 10000))
    }, 40000)

    it('should filter with > operator for numeric values', async () => {
      let received3rep = false
      let received5rep = false
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (eventData.type === 'next' && event.data.includes('INSERT')) {
          if (event.data.includes('test-deploy-3rep') && event.data.includes('Deployment')) {
            received3rep = true
          } else if (event.data.includes('test-deploy-5rep') && event.data.includes('Deployment')) {
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
                  { property: 'desired', values: ['>2'] },
                ],
              },
            },
            operationName: 'watch',
          },
        })
      )

      await new Promise((resolve) => setTimeout(resolve, 50))

      // Scale deployments to trigger events
      await execCliCmdString('oc scale deployment test-deploy-3rep -n default --replicas=3')
      await execCliCmdString('oc scale deployment test-deploy-5rep -n default --replicas=5')

      await new Promise((resolve) => setTimeout(resolve, 5000))

      expect(received3rep).toBe(true)
      expect(received5rep).toBe(true)
      ws.close()
    }, 15000)

    it('should filter with >= operator for numeric values', async () => {
      let received3rep = false
      let received5rep = false
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (eventData.type === 'next' && event.data.includes('Deployment')) {
          if (event.data.includes('test-deploy-3rep')) {
            received3rep = true
          } else if (event.data.includes('test-deploy-5rep')) {
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
                  { property: 'desired', values: ['>=3'] },
                ],
              },
            },
            operationName: 'watch',
          },
        })
      )

      await new Promise((resolve) => setTimeout(resolve, 50))
      await execCliCmdString('oc scale deployment test-deploy-3rep -n default --replicas=4')
      await execCliCmdString('oc scale deployment test-deploy-5rep -n default --replicas=6')

      await new Promise((resolve) => setTimeout(resolve, 5000))

      expect(received3rep).toBe(true)
      expect(received5rep).toBe(true)
      ws.close()
    }, 15000)

    it('should filter with < operator for numeric values', async () => {
      let received2rep = false
      let received3rep = false
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (eventData.type === 'next' && event.data.includes('Deployment')) {
          if (event.data.includes('test-deploy-2rep')) {
            received2rep = true
          } else if (event.data.includes('test-deploy-3rep')) {
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
                  { property: 'desired', values: ['<5'] },
                ],
              },
            },
            operationName: 'watch',
          },
        })
      )

      await new Promise((resolve) => setTimeout(resolve, 50))
      await execCliCmdString('oc scale deployment test-deploy-2rep -n default --replicas=3')
      await execCliCmdString('oc scale deployment test-deploy-3rep -n default --replicas=4')

      await new Promise((resolve) => setTimeout(resolve, 5000))

      expect(received2rep).toBe(true)
      expect(received3rep).toBe(true)
      ws.close()
    }, 15000)

    it('should filter with <= operator for numeric values', async () => {
      let received2rep = false
      let received3rep = false
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (eventData.type === 'next' && event.data.includes('Deployment')) {
          if (event.data.includes('test-deploy-2rep')) {
            received2rep = true
          } else if (event.data.includes('test-deploy-3rep')) {
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
                  { property: 'desired', values: ['<=3'] },
                ],
              },
            },
            operationName: 'watch',
          },
        })
      )

      await new Promise((resolve) => setTimeout(resolve, 50))
      await execCliCmdString('oc scale deployment test-deploy-2rep -n default --replicas=2')
      await execCliCmdString('oc scale deployment test-deploy-3rep -n default --replicas=3')

      await new Promise((resolve) => setTimeout(resolve, 5000))

      expect(received2rep).toBe(true)
      expect(received3rep).toBe(true)
      ws.close()
    }, 15000)
  })

  describe('String (lexicographic) comparison operators', () => {
    beforeAll(async () => {
      // Create ConfigMaps with different names for lexicographic testing
      await execCliCmdString('oc create configmap test-alpha -n default')
      await execCliCmdString('oc create configmap test-beta -n default')
      await execCliCmdString('oc create configmap test-gamma -n default')

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
                  { property: 'name', values: ['>test-alpha'] },
                ],
              },
            },
            operationName: 'watch',
          },
        })
      )

      await new Promise((resolve) => setTimeout(resolve, 50))
      // Recreate to trigger INSERT events
      await execCliCmdString('oc delete configmap test-beta test-gamma -n default --ignore-not-found=true')
      await execCliCmdString('oc create configmap test-beta -n default')
      await execCliCmdString('oc create configmap test-gamma -n default')

      await new Promise((resolve) => setTimeout(resolve, 5000))

      expect(receivedBeta).toBe(true)
      expect(receivedGamma).toBe(true)
      ws.close()
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
                  { property: 'name', values: ['<test-beta'] },
                ],
              },
            },
            operationName: 'watch',
          },
        })
      )

      await new Promise((resolve) => setTimeout(resolve, 50))
      await execCliCmdString('oc delete configmap test-alpha -n default --ignore-not-found=true')
      await execCliCmdString('oc create configmap test-alpha -n default')

      await new Promise((resolve) => setTimeout(resolve, 5000))

      expect(receivedAlpha).toBe(true)
      ws.close()
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
                  { property: 'name', values: ['test-cm-wildcard-*'] },
                ],
              },
            },
            operationName: 'watch',
          },
        })
      )

      await new Promise((resolve) => setTimeout(resolve, 50))
      await execCliCmdString('oc create configmap test-cm-wildcard-match -n default')

      while (!receivedCM) {
        await new Promise((resolve) => setTimeout(resolve, 10))
      }

      expect(receivedCM).toBe(true)
      ws.close()
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
                  { property: 'name', values: ['!=test-cm-wildcard-*'] },
                ],
              },
            },
            operationName: 'watch',
          },
        })
      )

      await new Promise((resolve) => setTimeout(resolve, 50))
      await execCliCmdString('oc create configmap test-cm-wildcard-nomatch -n default')

      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Should not receive any events because wildcard with != is not supported
      expect(receivedAnyCM).toBe(false)
      ws.close()
    }, 11000)
  })

  afterAll(async () => {
    // Clean up all test resources
    const configmaps = [
      'test-cm-equality',
      'test-cm-explicit-eq',
      'test-cm-case',
      'test-cm-not-equal-1',
      'test-cm-not-equal-2',
      'test-cm-bang-1',
      'test-cm-bang-2',
      'test-alpha',
      'test-beta',
      'test-gamma',
      'test-cm-wildcard-match',
      'test-cm-wildcard-nomatch',
    ]

    const deployments = ['test-deploy-2rep', 'test-deploy-3rep', 'test-deploy-5rep']

    const secrets = ['test-secret-ne']

    for (const cm of configmaps) {
      await execCliCmdString(`oc delete configmap ${cm} -n default --ignore-not-found=true`)
    }

    for (const deploy of deployments) {
      await execCliCmdString(`oc delete deployment ${deploy} -n default --ignore-not-found=true`)
    }

    for (const secret of secrets) {
      await execCliCmdString(`oc delete secret ${secret} -n default --ignore-not-found=true`)
    }
  }, 60000)
})
