// Copyright Contributors to the Open Cluster Management project

// Test multiple concurrent websocket connections to the subscription API.

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
      msgCount: 0,
    }))

    for (const wsItem of wsList) {
      wsItem.ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      wsItem.ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (eventData.type === 'next') {
          if (event.data.includes('INSERT') && event.data.includes('ConfigMap')) {
            wsItem.msgCount++ // Count ConfigMap INSERT events only.
          }
        } else if (eventData.type === 'ping') {
          wsItem.ws.send('{"type":"pong"}')
        } else {
          console.log('Unexpected message from websocket: ', wsItem.id, 'data: ', event.data)
        }
      }

      // Start the subscriptions on each websocket.
      wsItem.ws.send(
        `{"id":"0000-000${wsItem.id}","type":"subscribe","payload":{"query":"subscription watch($input: SearchInput) { watch(input: $input) { uid operation newData oldData timestamp } }","variables":{"input":{"keywords":[],"filters":[{"property":"kind","values":["ConfigMap"]}]}},"operationName":"watch"}}`
      )
    }

    // Wait for the WebSocket connections and subscriptions to be established.
    await sleep(50)

    // Create ConfigMap resources.
    for (let i = 0; i < totalConfigMaps; i++) {
      await execCliCmdString(`oc create configmap test-cm-scale-${i} -n default`)
    }

    // Wait for the events to be received on each websocket.
    for (const wsItem of wsList) {
      while (wsItem.msgCount < totalConfigMaps) {
        await sleep(10)
      }
    }

    // Close all websockets.
    for (const wsItem of wsList) {
      wsItem.ws.close()
    }
  }, 90000)

  afterAll(async () => {
    let cmNames = []
    for (let i = 0; i < totalConfigMaps; i++) {
      cmNames.push(`test-cm-scale-${i}`)
    }
    await execCliCmdString(`oc delete configmap ${cmNames.join(' ')} -n default`)
  })
})
