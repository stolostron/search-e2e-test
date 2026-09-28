// Copyright Contributors to the Open Cluster Management project

/**
 * Subscription-based resource readiness utilities.
 *
 * Alternative to DB polling (PR #497): uses the Search API WebSocket
 * subscription (watch) to receive real-time INSERT events and resolve
 * only when the required resources are confirmed indexed.
 */

const WebSocket = require('ws')
const { getIngressCA } = require('./clusterAccess')

/**
 * Open a WebSocket connection authenticated with the given token and
 * negotiate the graphql-transport-ws sub-protocol.
 *
 * TLS verification is performed using the cluster's ingress CA certificate
 * retrieved from the `openshift-ingress-operator/router-ca` secret.
 *
 * @param {string} websocketUrl  - Base URL of the Search API (wss://...).
 * @param {string} token         - Bearer token for authentication.
 * @returns {Promise<WebSocket>} Resolved once the connection_ack is received.
 */
function openAuthenticatedWebSocket(websocketUrl, token) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${websocketUrl}/searchapi/graphql`, 'graphql-transport-ws', {
      ca: getIngressCA(),
    })

    const timeout = setTimeout(() => {
      ws.terminate()
      reject(new Error('[subscriptionClient] Timed out waiting for connection_ack'))
    }, 15000)

    ws.onerror = (event) => {
      clearTimeout(timeout)
      reject(new Error(`[subscriptionClient] WebSocket error: ${event.message}`))
    }

    ws.onmessage = (event) => {
      if (event.data.includes('connection_ack')) {
        clearTimeout(timeout)
        resolve(ws)
      }
    }

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'connection_init',
          payload: { Authorization: `Bearer ${token}` },
        })
      )
    }
  })
}

/**
 * Wait until all resources with the given names appear as INSERT events in
 * the search index for the specified namespace, using the Search watch
 * subscription.
 *
 * The function opens a WebSocket subscription filtered to the target
 * namespace, listens for INSERT events, and resolves once every name in
 * `requiredNames` has been observed.  A timeout throws an Error.
 *
 * @param {string}   websocketUrl    - Base URL of the Search API (wss://...).
 * @param {string}   token           - Admin bearer token (must have access to the namespace).
 * @param {string}   targetNamespace - Namespace to watch.
 * @param {string[]} requiredNames   - Resource names that must appear before resolving.
 * @param {Object}   [options]
 * @param {number}   [options.timeoutMs=300000] - Max wait time in ms.
 * @param {string}   [options.subscriptionId='resource-readiness'] - GraphQL subscription id.
 * @returns {Promise<void>} Resolves when all required resources are indexed.
 */
async function waitForIndexedResourcesViaSubscription(
  websocketUrl,
  token,
  targetNamespace,
  requiredNames,
  options = {}
) {
  const { timeoutMs = 300000, subscriptionId = 'resource-readiness' } = options

  const pending = new Set(requiredNames)

  if (pending.size === 0) {
    return // Nothing to wait for
  }

  console.log(
    `[subscriptionClient] Waiting for ${pending.size} resource(s) to be indexed in namespace '${targetNamespace}': ${[...pending].join(', ')}`
  )

  const ws = await openAuthenticatedWebSocket(websocketUrl, token)

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      ws.close()
      reject(
        new Error(
          `[subscriptionClient] Timed out after ${timeoutMs / 1000}s. ` +
            `Still waiting for: ${[...pending].join(', ')} in namespace '${targetNamespace}'`
        )
      )
    }, timeoutMs)

    ws.onmessage = (event) => {
      let msg
      try {
        msg = JSON.parse(event.data)
      } catch (_) {
        return
      }

      // graphql-transport-ws: data arrives as type='next', payload.data.watch
      if (msg.type !== 'next') return
      const watch = msg?.payload?.data?.watch
      if (!watch) return

      // Only care about INSERT events (new resources entering the index)
      if (watch.operation !== 'INSERT') return

      const name = watch.newData?.name
      if (!name) return

      if (pending.has(name)) {
        pending.delete(name)
        console.log(
          `[subscriptionClient] Indexed: '${name}' (${requiredNames.length - pending.size}/${requiredNames.length})`
        )
      }

      if (pending.size === 0) {
        clearTimeout(timer)
        ws.close()
        resolve()
      }
    }

    ws.onerror = (event) => {
      clearTimeout(timer)
      ws.close()
      reject(new Error(`[subscriptionClient] WebSocket error during watch: ${event.message}`))
    }

    ws.onclose = (event) => {
      if (pending.size > 0) {
        clearTimeout(timer)
        reject(
          new Error(`[subscriptionClient] WebSocket closed unexpectedly. Still waiting for: ${[...pending].join(', ')}`)
        )
      }
    }

    // Send the watch subscription filtered to the target namespace
    ws.send(
      JSON.stringify({
        id: subscriptionId,
        type: 'subscribe',
        payload: {
          query:
            'subscription watch($input: SearchInput) { watch(input: $input) { uid operation newData oldData timestamp } }',
          variables: {
            input: {
              keywords: [],
              filters: [{ property: 'namespace', values: [targetNamespace] }],
            },
          },
          operationName: 'watch',
        },
      })
    )
  })
}

exports.openAuthenticatedWebSocket = openAuthenticatedWebSocket
exports.waitForIndexedResourcesViaSubscription = waitForIndexedResourcesViaSubscription
