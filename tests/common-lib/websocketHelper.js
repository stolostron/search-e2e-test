// Copyright Contributors to the Open Cluster Management project

// Helper functions for websocket testing.

const WebSocket = require('ws')

async function createWebSocket(url, authToken) {
  let authAcknoledged = false
  const ws = new WebSocket(url, 'graphql-transport-ws', {
    rejectUnauthorized: false,
  })
  ws.onmessage = (event) => {
    if (event.data.includes('connection_ack')) {
      authAcknoledged = true
    }
  }
  ws.onerror = (event) => {
    console.log('WebSocket error:', event)
  }

  ws.onopen = () => {
    ws.send('{"type":"connection_init","payload":{"Authorization":"Bearer ' + authToken + '"}}')
  }

  while (!authAcknoledged) {
    await new Promise((resolve) => setTimeout(resolve, 10))
  }

  return ws
}

module.exports = {
  createWebSocket,
}
