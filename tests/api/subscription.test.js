// Copyright Contributors to the Open Cluster Management project

// Test the subscription API.

const squad = require('../../config').get('squadName')

const WebSocket = require('ws')
const { execCliCmdString } = require('../common-lib/cliClient')
const { getKubeadminToken, getSearchApiRoute } = require('../common-lib/clusterAccess')

let websocketUrl = ''
describe(`[P2][Sev2][${squad}] RHACM4K-61828:Subscription API`, () => {
  beforeAll(async () => {
    // Log in and get access token
    token = getKubeadminToken()

    // Create a route to access the Search API.
    searchApiRoute = await getSearchApiRoute()
    websocketUrl = searchApiRoute.replace('https://', 'wss://')
  })

  it('should authenticate subscription', async () => {
    let connectionAck = false
    // Start a websocket connection to the subscription API.
    const ws = new WebSocket(`${websocketUrl}/searchapi/graphql`, 'graphql-transport-ws', {
      rejectUnauthorized: false,
    })

    ws.onmessage = (event) => {
      expect(event.data).toContain('connection_ack')
      connectionAck = true
    }

    ws.onopen = () => {
      ws.send('{"type":"connection_init","payload":{"Authorization":"Bearer ' + token + '"}}')
    }

    // Wait for the connection to be acknowledged.
    while (!connectionAck) {
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
    expect(connectionAck).toBe(true)
    ws.close()
  })

  it('should fail authentication with invalid token', async () => {
    let msgCount = 0
    let connectionClosed = false
    const ws = new WebSocket(`${searchApiRoute}/searchapi/graphql`, 'graphql-transport-ws', {
      rejectUnauthorized: false,
    })

    ws.onmessage = (event) => {
      msgCount++
    }
    ws.onclose = () => {
      connectionClosed = true
    }
    ws.onopen = () => {
      ws.send('{"type":"connection_init","payload":{"Authorization":"Bearer invalid-token"}}')
    }

    // Wait for the connection to be closed.
    while (!connectionClosed) {
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
    expect(connectionClosed).toBe(true)
    expect(msgCount).toBe(0)
    expect(ws.readyState).toBe(WebSocket.CLOSED)
  })

  it('should receive ping messages', async () => {
    let gotPing = false
    const ws = new WebSocket(`${websocketUrl}/searchapi/graphql`, 'graphql-transport-ws', {
      rejectUnauthorized: false,
    })

    ws.onmessage = (event) => {
      if (event.data.includes('ping')) {
        gotPing = true
      }
    }
    ws.onopen = () => {
      ws.send('{"type":"connection_init","payload":{"Authorization":"Bearer ' + token + '"}}')
    }

    // Wait for the connection to be established and ping message to be received.
    while (!gotPing) {
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
    expect(gotPing).toBe(true)
    ws.close()
  }, 11000) // Should receive ping within 10 seconds. Additional 1 second to stabilize test.

  it('should receive resource events', async () => {
    let gotConfigMap = false
    const ws = new WebSocket(`${websocketUrl}/searchapi/graphql`, 'graphql-transport-ws', {
      rejectUnauthorized: false,
    })

    ws.onopen = () => {
      ws.send('{"type":"connection_init","payload":{"Authorization":"Bearer ' + token + '"}}')
      ws.send(
        '{"id":"0000-0001","type":"subscribe","payload":{"query":"subscription watch($input: SearchInput) { watch(input: $input) { uid operation newData oldData timestamp } }","variables":{"input":{"keywords":[],"filters":[{"property":"kind","values":["ConfigMap"]},{"property":"name","values":["test-cm"]}]}},"operationName":"watch"}}'
      )
    }

    ws.onmessage = (event) => {
      const eventData = JSON.parse(event.data)
      if (eventData.type === 'next' && event.data.includes('INSERT') && event.data.includes('ConfigMap')) {
        gotConfigMap = true
      }
    }

    // Wait for the WebSocket connection to be established.
    await new Promise((resolve) => setTimeout(resolve, 50))

    // Create a ConfigMap resource.
    await execCliCmdString('oc create configmap test-cm -n default')
    await execCliCmdString('oc create configmap test-cm-2 -n default')

    // Wait for the event to be received.
    while (!gotConfigMap) {
      await new Promise((resolve) => setTimeout(resolve, 10))
    }

    expect(gotConfigMap).toBe(true)
    ws.close()
  }, 6000) // Should receive message within 5 seconds. Additional 1 second grace period.

  afterAll(async () => {
    await execCliCmdString('oc delete configmap test-cm -n default')
    await execCliCmdString('oc delete configmap test-cm-2 -n default')
  })
})
