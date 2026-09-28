// Copyright Contributors to the Open Cluster Management project

/**
 * Subscription-based resource readiness utilities.
 *
 * Alternative to DB polling (PR #497): uses the Search API WebSocket
 * subscription (watch) to receive real-time INSERT/UPDATE events and resolve
 * only when the required resources are confirmed indexed.
 */

const tls = require('tls')
const WebSocket = require('ws')
const { getServiceCA } = require('./clusterAccess')

/**
 * Open a WebSocket connection authenticated with the given token and
 * negotiate the graphql-transport-ws sub-protocol.
 *
 * TLS is verified against the OpenShift service CA certificate. Hostname
 * verification is relaxed via `checkServerIdentity` because the Search API
 * route is a TLS passthrough: the service certificate's SANs cover the
 * internal service DNS name (e.g. `search-search-api.<ns>.svc`), not the
 * public route hostname. The CA chain is still fully verified.
 *
 * @param {string} websocketUrl  - Base URL of the Search API (wss://...).
 * @param {string} token         - Bearer token for authentication.
 * @returns {Promise<WebSocket>} Resolved once the connection_ack is received.
 */
function openAuthenticatedWebSocket(websocketUrl, token) {
  return new Promise((resolve, reject) => {
    const ca = getServiceCA()
    const ws = new WebSocket(`${websocketUrl}/searchapi/graphql`, 'graphql-transport-ws', {
      ca,
      // The service certificate's SANs cover the internal cluster DNS name, not
      // the route hostname. Skip hostname matching while keeping CA verification.
      checkServerIdentity: (hostname, cert) => {
        // tls.checkServerIdentity throws if the hostname doesn't match. We catch
        // that specific error and ignore it — the CA chain check above still runs.
        try {
          tls.checkServerIdentity(hostname, cert)
        } catch (e) {
          if (e.code === 'ERR_TLS_CERT_ALTNAME_INVALID') return undefined
          throw e
        }
      },
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
 * Open a watch subscription on the Search API and return a promise that
 * resolves when all required fixtures are confirmed indexed.
 *
 * The function is split into two phases to eliminate the TOCTOU race between
 * subscription registration and fixture creation:
 *
 *   1. Call `waitForIndexedResourcesViaSubscription(...)` — this returns a
 *      `{ subscriptionReady, done }` object.  `subscriptionReady` resolves
 *      once the subscribe frame has been sent to the server (i.e. after
 *      `connection_ack` is received).
 *   2. Await `subscriptionReady` before creating any test fixtures.
 *   3. Create fixtures, then await `done`.
 *
 * Fixtures are tracked with per-resource readiness predicates. Labeled
 * configmaps require the expected label to be present in `watch.newData`
 * before the fixture is counted as ready; an unlabeled INSERT leaves it
 * pending for a subsequent labeled UPDATE.
 *
 * Rejects immediately — rather than hanging until timeout — when the server
 * sends an `error` or premature `complete` frame for the subscription.
 *
 * @param {string}   websocketUrl    - Base URL of the Search API (wss://...).
 * @param {string}   token           - Admin bearer token.
 * @param {string}   targetNamespace - Namespace to watch.
 * @param {Array<{name:string, ready?:(newData:object)=>boolean}>} fixtures
 *   Each entry names a resource. The optional `ready` predicate receives
 *   `watch.newData` and returns true when the event represents the final
 *   indexed state. Defaults to always-true (any INSERT or UPDATE is enough).
 * @param {Object}  [options]
 * @param {number}  [options.timeoutMs=300000]               - Max wait ms.
 * @param {string}  [options.subscriptionId='resource-readiness'] - GQL sub id.
 * @returns {{ subscriptionReady: Promise<void>, done: Promise<void> }}
 */
function waitForIndexedResourcesViaSubscription(websocketUrl, token, targetNamespace, fixtures, options = {}) {
  const { timeoutMs = 300000, subscriptionId = 'resource-readiness' } = options

  if (fixtures.length === 0) {
    return { subscriptionReady: Promise.resolve(), done: Promise.resolve() }
  }

  // Build a map of name → readiness predicate (defaults to always true).
  const readyFn = new Map(fixtures.map(({ name, ready = () => true }) => [name, ready]))
  const pending = new Set(readyFn.keys())

  console.log(
    `[subscriptionClient] Waiting for ${pending.size} resource(s) to be indexed in namespace '${targetNamespace}': ${[...pending].join(', ')}`
  )

  let resolveSubscriptionReady
  const subscriptionReady = new Promise((res) => {
    resolveSubscriptionReady = res
  })

  const done = openAuthenticatedWebSocket(websocketUrl, token).then(
    (ws) =>
      new Promise((resolve, reject) => {
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
          // The collector may batch create+label into one INSERT (labels present),
          // or emit an unlabeled INSERT then a labeled UPDATE when a sync boundary
          // falls between the two oc commands.
          if (watch.operation !== 'INSERT' && watch.operation !== 'UPDATE') return

          const name = watch.newData?.name
          if (!name || !pending.has(name)) return

          // Only mark ready when the per-fixture predicate passes.
          if (readyFn.get(name)(watch.newData)) {
            pending.delete(name)
            console.log(
              `[subscriptionClient] Indexed: '${name}' (${fixtures.length - pending.size}/${fixtures.length})`
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
              new Error(
                `[subscriptionClient] WebSocket closed unexpectedly. Still waiting for: ${[...pending].join(', ')}`
              )
            )
          }
        }

        // Send the watch subscription filtered to the target namespace.
        // After this send, the subscription is registered on the server side.
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

        // Signal that the subscribe frame has been sent — callers can now create
        // fixtures knowing that all subsequent events will be captured.
        resolveSubscriptionReady()
      })
  )

  return { subscriptionReady, done }
}

exports.openAuthenticatedWebSocket = openAuthenticatedWebSocket
exports.waitForIndexedResourcesViaSubscription = waitForIndexedResourcesViaSubscription
