// Copyright Contributors to the Open Cluster Management project

/**
 * Subscription-based resource readiness utilities.
 *
 * Alternative to DB polling (PR #497): uses the Search API WebSocket
 * subscription (watch) to receive real-time INSERT/UPDATE events and resolve
 * only when the required resources are confirmed indexed.
 */

const WebSocket = require('ws')
const { getServiceCA } = require('./clusterAccess')

/**
 * Open a WebSocket connection authenticated with the given token and
 * negotiate the graphql-transport-ws sub-protocol.
 *
 * TLS verification is performed using the OpenShift service CA certificate.
 * The Search API route uses TLS passthrough, so the WebSocket sees the service
 * certificate (signed by the OpenShift service CA), not a router certificate.
 *
 * @param {string} websocketUrl  - Base URL of the Search API (wss://...).
 * @param {string} token         - Bearer token for authentication.
 * @returns {Promise<WebSocket>} Resolved once the connection_ack is received.
 */
function openAuthenticatedWebSocket(websocketUrl, token) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${websocketUrl}/searchapi/graphql`, 'graphql-transport-ws', {
      ca: getServiceCA(),
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
 * Wait until all resources with the given names are confirmed indexed in the
 * search index for the specified namespace, using the Search watch subscription.
 *
 * The subscription must be registered before the test fixtures are created so
 * that no INSERT events are missed. The function accepts both INSERT and UPDATE
 * events: the search-collector may batch a `create` + `label` into a single
 * INSERT (with labels already present), but if a sync boundary falls between the
 * two `oc` commands, the initial INSERT will be unlabeled and a subsequent UPDATE
 * will carry the labels. Accepting either event for a name removes it from the
 * pending set.
 *
 * Once the subscription is active, callers should check whether the fixtures
 * are already indexed (e.g. from a prior setup run) and remove those from the
 * pending set before waiting.
 *
 * Rejects immediately — rather than hanging until timeout — when the server
 * sends an `error` or premature `complete` frame for the subscription.
 *
 * @param {string}   websocketUrl    - Base URL of the Search API (wss://...).
 * @param {string}   token           - Admin bearer token (must have access to the namespace).
 * @param {string}   targetNamespace - Namespace to watch.
 * @param {string[]} requiredNames   - Resource names that must appear before resolving.
 * @param {Object}   [options]
 * @param {number}   [options.timeoutMs=300000] - Max wait time in ms.
 * @param {string}   [options.subscriptionId='resource-readiness'] - GraphQL subscription id.
 * @returns {Promise<{ws: WebSocket, done: Promise<void>}>}
 *   `ws`   – the open authenticated WebSocket (so callers can send the subscribe
 *             frame *after* setting up fixtures, avoiding the TOCTOU window).
 *   `done` – resolves when all `requiredNames` have been observed.
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

      // Fail fast on server-side subscription errors or unexpected stream completion.
      if (msg.id === subscriptionId) {
        if (msg.type === 'error') {
          clearTimeout(timer)
          ws.close()
          const detail = JSON.stringify(msg.payload ?? msg)
          reject(new Error(`[subscriptionClient] Subscription rejected by server: ${detail}`))
          return
        }
        if (msg.type === 'complete') {
          clearTimeout(timer)
          ws.close()
          reject(
            new Error(
              `[subscriptionClient] Subscription completed prematurely. Still waiting for: ${[...pending].join(', ')}`
            )
          )
          return
        }
      }

      // graphql-transport-ws: data arrives as type='next', payload.data.watch
      if (msg.type !== 'next') return
      const watch = msg?.payload?.data?.watch
      if (!watch) return

      // Accept both INSERT and UPDATE events.
      // The collector may send a combined INSERT that already includes labels
      // (create + label within the same sync window), or it may send a bare
      // INSERT followed by a labeled UPDATE when a sync boundary falls between
      // the two `oc` commands. Either event confirms the resource is indexed.
      if (watch.operation !== 'INSERT' && watch.operation !== 'UPDATE') return

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

    ws.onclose = () => {
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
