// Copyright Contributors to the Open Cluster Management project

// Scale tests for the subscription API.

const squad = require('../../config').get('squadName')

const { execCliCmdString } = require('../common-lib/cliClient')
const { getKubeadminToken, getSearchApiRoute } = require('../common-lib/clusterAccess')
const { sleep } = require('../common-lib/sleep')
const { createWebSocket } = require('../common-lib/websocketHelper')

let websocketUrl = ''
describe(`[P2][Sev2][${squad}] Subscription API: Scale tests`, () => {
  beforeAll(async () => {
    // Log in and get access token
    token = getKubeadminToken()

    // Create a route to access the Search API.
    searchApiRoute = await getSearchApiRoute()
    websocketUrl = searchApiRoute.replace('https://', 'wss://')
  })

  // BUGS:
  // 1. When ConfigMaps are created rapidly, the server only sends 1 message and immediately
  //    after it sends the complete message.
  // 2. When a connection is abnormally closed (stopping a running test), the server is unable to
  //    register new subscriptions. The websocket connects, but is unable to receive messages.
  //    WORKAROUND: Restart the server.
  //
  const totalWebsockets = 5 // TODO: Goal is 50 concurrent websocket connections.
  const totalConfigMaps = 2 // TODO: Goal is about 1 ConfigMap per second.
  it.only(`should receive events for ${totalWebsockets} concurrent websocket connections`, async () => {
    const wsList = Array.from({ length: totalWebsockets }, (_, index) => ({
      id: index,
      gotConfigMap: false,
      msgCount: 0,
    }))

    for (const wsItem of wsList) {
      wsItem.ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      wsItem.ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (eventData.type === 'next' && event.data.includes('INSERT') && event.data.includes('ConfigMap')) {
          wsItem.gotConfigMap = true
          wsItem.msgCount++ // Ignore ping messages.
        } else if (eventData.type === 'ping') {
          wsItem.ws.send('{"type":"pong"}')
        } else if (eventData.type === 'error') {
          console.log('WebSocket error:', event)
          expect.fail('Unexpected Websocket error')
        } else if (eventData.type === 'complete') {
          console.log('Received WebSocket complete message: ', wsItem.id, 'data: ', event.data)
          // BUG: When ConfigMaps are created rapidly. The server only sends 1 message and
          // immediately after it sends the complete message.
          // WORKAROUND: Re-subscribe to continue receiving messages.
          wsItem.ws.send(
            `{"id":"0000-000${wsItem.id}","type":"subscribe","payload":{"query":"subscription watch($input: SearchInput) { watch(input: $input) { uid operation newData oldData timestamp } }","variables":{"input":{"keywords":[],"filters":[{"property":"kind","values":["ConfigMap"]}]}},"operationName":"watch"}}`
          )
        }
      }

      // Start the subscriptions.
      wsItem.ws.send(
        `{"id":"0000-000${wsItem.id}","type":"subscribe","payload":{"query":"subscription watch($input: SearchInput) { watch(input: $input) { uid operation newData oldData timestamp } }","variables":{"input":{"keywords":[],"filters":[{"property":"kind","values":["ConfigMap"]}]}},"operationName":"watch"}}`
      )
    }

    // Wait for the WebSocket connections to be established.
    await sleep(200)

    // Create ConfigMap resources.
    for (let i = 0; i < totalConfigMaps; i++) {
      // Create a ConfigMap resource.
      await execCliCmdString(`oc create configmap test-cm-scale-${i} -n default`)
      await sleep(6000)
    }

    // Wait for the events to be received on each websocket.
    for (const wsItem of wsList) {
      while (wsItem.msgCount < totalConfigMaps) {
        console.log(
          `Waiting for messages on websocket ${wsItem.id} expected: ${totalConfigMaps} current: ${wsItem.msgCount}`
        )
        await sleep(1000)
      }
    }

    // Close all websockets.
    for (const wsItem of wsList) {
      wsItem.ws.close()
    }
  }, 90000)

  afterAll(async () => {
    for (let i = 0; i < totalConfigMaps; i++) {
      await execCliCmdString(`oc delete configmap test-cm-scale-${i} -n default`)
    }
  })
})
