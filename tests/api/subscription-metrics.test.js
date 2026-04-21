// Copyright Contributors to the Open Cluster Management project

// Test openshift metrics of active search subscriptions.
const squad = require('../../config').get('squadName')

const { execCliCmdString } = require('../common-lib/cliClient')
const { getKubeadminToken, getSearchApiRoute, getThanosQuerierRoute } = require('../common-lib/clusterAccess')
const { createWebSocket } = require('../common-lib/websocketHelper')
const { waitFor } = require('../common-lib')
const request = require('supertest')
const https = require('https')

let websocketUrl, token, thanosQuerierApi

describe(`[P2][Sev2][${squad}] RHACM-61294: Openshift Metrics of active Search Subscriptions`, () => {
  beforeAll(async () => {
    // Log in and get access token
    token = getKubeadminToken()

    // Create a route to access the Search API.
    const searchApiRoute = await getSearchApiRoute()
    websocketUrl = searchApiRoute.replace('https://', 'wss://')

    // Query Thanos API
    thanosQuerierApi = await getThanosQuerierRoute()
  })

  it(
    'should return metrics for active subscriptions',
    async () => {
      let metricsName = 'search_api_subscriptions_active'
      let resp = await queryMetrics(metricsName)
      let subscriptionCount = resp.body.data.result[0].value[1]

      const ws = await createWebSocket(`${websocketUrl}/searchapi/graphql`, token)

      //query Thanos metrics
      async function queryMetrics(metricsName) {
        const agent = new https.Agent({ rejectUnauthorized: false })
        return request(thanosQuerierApi)
          .get(`/api/v1/query?query=${metricsName}`)
          .agent(agent)
          .set({ Authorization: `Bearer ${token}` })
          .expect(200)
          .then((r) => {
            return r
          })
      }

      // Subscribe with no filter
      ws.send(
        JSON.stringify({
          id: '1001',
          type: 'subscribe',
          payload: {
            query:
              'subscription watch($input: SearchInput) { watch(input: $input) { uid operation newData oldData timestamp } }',
            variables: {},
            operationName: 'watch',
          },
        })
      )

      try {
        subscriptionCount++
        await new Promise((resolve) => setTimeout(resolve, 100))

        let retries = 0
        const maxRetries = 10
        // Retry until metric updates or max retries reached
        resp = await queryMetrics(metricsName)
        while (parseInt(resp.body.data.result[0].value[1]) < subscriptionCount && retries < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 5000))
          resp = await queryMetrics(metricsName)
          retries++
        }

        // Ensure we didn't exhaust retries (metric should have updated)
        expect(retries).toBeLessThan(maxRetries)

        // Verify metric content
        expect(resp.body.data.result[0].metric['__name__']).toEqual(metricsName)
        expect(parseInt(resp.body.data.result[0].value[1])).toBeGreaterThanOrEqual(subscriptionCount)
      } finally {
        ws.close()
      }
    },
    60 * 1000
  )

  afterEach(async () => {
    // Wait for Openshift default scrape intervals (30-60s)
    await new Promise((resolve) => setTimeout(resolve, 3 * 15 * 1000))
  }, 60 * 1000)
})
