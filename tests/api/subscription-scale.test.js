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

  const totalWebsockets = 50
  const totalConfigMaps = 60 // About 1 ConfigMap per second.
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
        } else {
          console.log('Unexpected message from websocket: ', wsItem.id, 'data: ', event.data)
        }
      }

      // Start the subscriptions.
      wsItem.ws.send(
        `{"id":"0000-000${wsItem.id}","type":"subscribe","payload":{"query":"subscription watch($input: SearchInput) { watch(input: $input) { uid operation newData oldData timestamp } }","variables":{"input":{"keywords":[],"filters":[{"property":"kind","values":["ConfigMap"]}]}},"operationName":"watch"}}`
      )
    }

    // Wait for the WebSocket connections to be established.
    await sleep(100)

    // Create ConfigMap resources.
    for (let i = 0; i < totalConfigMaps; i++) {
      // Create a ConfigMap resource.
      await execCliCmdString(`oc create configmap test-cm-scale-${i} -n default`)
    }

    // Wait for the events to be received on each websocket.
    for (const wsItem of wsList) {
      while (wsItem.msgCount < totalConfigMaps) {
        // console.log(
        //   `Waiting for messages on websocket ${wsItem.id} expected: ${totalConfigMaps} current: ${wsItem.msgCount}`
        // )
        await sleep(100)
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
