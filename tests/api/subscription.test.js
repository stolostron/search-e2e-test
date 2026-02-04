// Copyright Contributors to the Open Cluster Management project

// Test the subscription API.

const squad = require('../../config').get('squadName')

const { execCliCmdString, expectCli } = require('../common-lib/cliClient')
const { getKubeadminToken, getSearchApiRoute } = require('../common-lib/clusterAccess')
const WebSocket = require('ws')

let websocketUrl = ''
describe(`[P2][Sev2][${squad}] Subscription API`, () => {
  beforeAll(async () => {
    // Log in and get access token
    token = getKubeadminToken()

    // Create a route to access the Search API.
    searchApiRoute = await getSearchApiRoute()
    websocketUrl = searchApiRoute.replace('https://', 'wss://')
  })

  it('should authenticate subscription', async () => {
    let msgCount = 0
    // Start a websocket connection to the subscription API.
    const ws = new WebSocket(`${websocketUrl}/searchapi/graphql`, 'graphql-transport-ws', {
      rejectUnauthorized: false,
    })

    ws.onmessage = (event) => {
      msgCount++
      expect(event.data).toContain('connection_ack')
    }
    ws.onerror = (event) => {
      console.log('WebSocket error:', event)
      expect.fail('Unexpected Websocket error')
    }
    ws.onclose = () => {
      expect(msgCount).toBe(1)
    }

    ws.onopen = () => {
      ws.send('{"type":"connection_init","payload":{"Authorization":"Bearer ' + token + '"}}')
      ws.close()
    }

    // Wait for the connection to be established and the message to be received.
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(msgCount).toBe(1)
  })

  it('should fail authentication with invalid token', async () => {
    let msgCount = 0
    const ws = new WebSocket(`${searchApiRoute}/searchapi/graphql`, 'graphql-transport-ws', {
      rejectUnauthorized: false,
    })

    ws.onmessage = (event) => {
      msgCount++
    }
    ws.onerror = (event) => {
      expect(event).toContain('error')
    }
    ws.onclose = () => {
      expect(msgCount).toBe(0)
    }
    ws.onopen = () => {
      ws.send('{"type":"connection_init","payload":{"Authorization":"Bearer invalid-token"}}')
      ws.send(
        '{"id":"00000000-1","type":"subscribe","payload":{"query":"subscription watch($input: SearchInput) { watch(input: $input) { uid operation newData oldData timestamp } }","variables":{"input":{"keywords":[],"filters":[{"property":"kind","values":["Pod"]}]}},"operationName":"watch"}}'
      )
    }

    // Wait for the connection to be established.
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(msgCount).toBe(0)
  })

  it('should receive ping messages', async () => {
    let msgCount = 0
    let gotPing = false
    const ws = new WebSocket(`${websocketUrl}/searchapi/graphql`, 'graphql-transport-ws', {
      rejectUnauthorized: false,
    })

    ws.onmessage = (event) => {
      if (msgCount === 1) {
        expect(event.data).toContain('ping')
        gotPing = true
        ws.close()
      }
      msgCount++
    }
    ws.onopen = () => {
      ws.send('{"type":"connection_init","payload":{"Authorization":"Bearer ' + token + '"}}')
    }

    // Wait for the connection to be established and ping message to be received.
    while (!gotPing) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    expect(msgCount).toBe(2)
  }, 15000)

  it('should receive resource events', async () => {
    let msgCount = 0
    let gotConfigMap = false
    const ws = new WebSocket(`${websocketUrl}/searchapi/graphql`, 'graphql-transport-ws', {
      rejectUnauthorized: false,
    })

    ws.onopen = () => {
      ws.send('{"type":"connection_init","payload":{"Authorization":"Bearer ' + token + '"}}')
      ws.send(
        '{"id":"0000-0001","type":"subscribe","payload":{"query":"subscription watch($input: SearchInput) { watch(input: $input) { uid operation newData oldData timestamp } }","variables":{"input":{"keywords":[],"filters":[{"property":"kind","values":["ConfigMap"]}]}},"operationName":"watch"}}'
      )
    }

    ws.onerror = (event) => {
      console.log('WebSocket error:', event)
      expect.fail('Unexpected Websocket error')
    }

    ws.onmessage = (event) => {
      const eventData = JSON.parse(event.data)
      if (eventData.type === 'next') {
        expect(event.data).toContain('INSERT')
        expect(event.data).toContain('ConfigMap')

        gotConfigMap = true
        ws.close()
      }
      msgCount++
    }

    // Wait for the WebSocket connection to be established.
    await new Promise((resolve) => setTimeout(resolve, 200))

    // Create a ConfigMap resource.
    await execCliCmdString('oc create configmap test-cm -n default')

    // Wait for the event to be received.
    while (!gotConfigMap) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    expect(msgCount).toBe(2)
  }, 6000) // Should receive message within 5 seconds. Additional 1 second grace period.

  afterAll(async () => {
    await execCliCmdString('oc delete configmap test-cm -n default')
  })
})
