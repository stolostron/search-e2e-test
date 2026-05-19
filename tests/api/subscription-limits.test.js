// Copyright Contributors to the Open Cluster Management project

// Test rate limits of active search subscriptions.
const squad = require('../../config').get('squadName')

const { execCliCmdString } = require('../common-lib/cliClient')
const {
  getKubeadminToken,
  getSearchApiRoute,
  getThanosQuerierRoute,
  getAcmNamespace,
} = require('../common-lib/clusterAccess')
const { createWebSocket } = require('../common-lib/websocketHelper')
const { waitFor } = require('../common-lib')
const { execFileSync, execSync } = require('child_process')

let websocketUrl, token, acmNamespace, initDeployQueryApi
const sub_max_active = 1
const sub_max_lifetime = 60000
const sub_max_idle = 5000

describe(`[P2][Sev2][${squad}] RHACM-63733: Rate limits on subscriptions`, () => {
  beforeAll(async () => {
    // Log in and get access token
    token = getKubeadminToken()
    acmNamespace = getAcmNamespace()

    // Create a route to access the Search API.
    const searchApiRoute = await getSearchApiRoute()
    websocketUrl = searchApiRoute.replace('https://', 'wss://')

    //get Search deployment init queryapi
    initDeployQueryApi = execFileSync(
      'oc',
      ['-n', acmNamespace, 'get', 'search', 'search-v2-operator', '-o', "jsonpath='{.spec.deployments.queryapi}'"],
      {
        encoding: 'utf8',
      }
    ).replace(/'/g, '')

    //update Search deployment with rate limits environment variables
    await execCliCmdString(`oc -n ${acmNamespace} patch search search-v2-operator \
          --type='json' \
          --type=merge \
          --patch '{"spec":{"deployments":{"queryapi":{"envVar":[{"name":"SUBSCRIPTION_MAX_ACTIVE","value":"${sub_max_active}"},{"name":"SUBSCRIPTION_MAX_LIFETIME","value":"${sub_max_lifetime}"},{"name":"SUBSCRIPTION_IDLE_TIMEOUT","value":"${sub_max_idle}"}]}}}}'`)
    await waitForSeachDeployUpdate()
  }, 60000)

  it(
    'should reject new subscription once max active subscriptions reached',
    async () => {
      let gotRejected = false

      const ws1 = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)
      const ws2 = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      const ws1Active = new Promise((resolve, reject) => {
        ws1.onmessage = (event) => {
          const eventData1 = JSON.parse(event.data)
          if (eventData1.type === 'next') resolve()
          if (eventData1.type === 'error') reject(new Error('first subscription failed'))
        }
      })

      ws1.send(
        JSON.stringify({
          id: '2000',
          type: 'subscribe',
          payload: {
            query:
              'subscription watch($input: SearchInput) { watch(input: $input) { uid operation newData oldData timestamp } }',
            variables: {},
            operationName: 'watch',
          },
        })
      )

      await ws1Active

      ws2.send(
        JSON.stringify({
          id: '2001',
          type: 'subscribe',
          payload: {
            query:
              'subscription watch($input: SearchInput) { watch(input: $input) { uid operation newData oldData timestamp } }',
            variables: {},
            operationName: 'watch',
          },
        })
      )

      ws2.onmessage = (event) => {
        const eventData2 = JSON.parse(event.data)
        const message = eventData2?.payload?.errors?.[0]?.message
        if (typeof message === 'string' && message.includes('maximum active subscriptions reached')) {
          gotRejected = true
        }
      }

      try {
        await new Promise((resolve) => setTimeout(resolve, 100))
        await waitFor(() => gotRejected)

        // Verify new subscription gets rejected
        expect(gotRejected).toBe(true)
      } finally {
        ws1.close()
        ws2.close()
      }
    },
    60 * 1000
  )

  it(
    'should stop the subscription when max lifetime reached',
    async () => {
      let termSig = false
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      ws.send(
        JSON.stringify({
          id: '2002',
          type: 'subscribe',
          payload: {
            query:
              'subscription watch($input: SearchInput) { watch(input: $input) { uid operation newData oldData timestamp } }',
            variables: {},
            operationName: 'watch',
          },
        })
      )

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (eventData.type === 'complete') {
          termSig = true
        }
      }

      try {
        //Assert subscription terminated
        await new Promise((resolve) => setTimeout(resolve, sub_max_lifetime + 10000))
        expect(termSig).toBe(true)
      } finally {
        ws.close()
      }
    },
    90 * 1000
  )

  it(
    'should stop the subscription when max idle reached',
    async () => {
      let termSig = false
      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      //watch non-existing data
      ws.send(
        JSON.stringify({
          id: '2003',
          type: 'subscribe',
          payload: {
            query:
              'subscription watch($input: SearchInput) { watch(input: $input) { uid operation newData oldData timestamp } }',
            variables: {
              input: {
                keywords: [],
                filters: [
                  { property: 'kind', values: ['ConfigMap'] },
                  { property: 'name', values: ['idle-wait-time'] },
                ],
              },
            },
            operationName: 'watch',
          },
        })
      )

      ws.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        if (eventData.type === 'complete') {
          termSig = true
        }
      }

      try {
        await new Promise((resolve) => setTimeout(resolve, 100))
        await waitFor(() => termSig, 30000 + sub_max_idle)

        // Assert subscription terminated
        expect(termSig).toBe(true)
      } finally {
        ws.close()
      }
    },
    60 * 1000
  )

  afterAll(async () => {
    // Reset search queryapi
    await execCliCmdString(`oc -n ${acmNamespace} patch search search-v2-operator \
          --type='json' \
          --type=merge \
          --patch '{"spec":{"deployments":{"queryapi":${initDeployQueryApi.length <= 2 ? null : initDeployQueryApi}}}}'`)
    await waitForSeachDeployUpdate()
  }, 60000)
})

async function waitForSeachDeployUpdate() {
  function getSearchDeployNewReplicas() {
    const raw = execFileSync('oc', ['-n', acmNamespace, 'get', 'deploy', 'search-api', '-o', 'json'], {
      encoding: 'utf8',
    })
    const deploy = JSON.parse(raw)
    const condition = deploy?.status?.conditions?.find((c) => c.reason === 'NewReplicaSetAvailable')
    return condition?.status ?? ''
  }

  let retries = 0
  const maxRetries = 10
  // Retry until search deploy new replica avail or max retries reached
  let stat = getSearchDeployNewReplicas()
  while (stat !== 'True' && retries < maxRetries) {
    await new Promise((resolve) => setTimeout(resolve, 3000))
    stat = getSearchDeployNewReplicas()
    retries++
  }
  if (stat !== 'True') {
    throw new Error('search-api deployment did not reach NewReplicaSetAvailable=True in time')
  }
  await new Promise((resolve) => setTimeout(resolve, 5000))
}
