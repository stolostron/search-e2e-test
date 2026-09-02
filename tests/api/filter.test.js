// Copyright Contributors to the Open Cluster Management project

jest.retryTimes(global.retry, { logErrorsBeforeRetry: true })

const { execSync } = require('child_process')

const squad = require('../../config').get('squadName')
const { getSearchApiRoute, getKubeadminToken, getLocalClusterName } = require('../common-lib/clusterAccess')
const { searchQueryBuilder, sendRequest } = require('../common-lib/searchClient')

const RELATIVE_DATE_VALUES = new Set(['hour', 'day', 'week', 'month', 'year'])

// Order matches search-v2-api getOperatorFromString (longer prefixes first).
const FILTER_OPERATORS = ['<=', '>=', '!=', '!', '<', '>', '=']

function parseFilterValue(trimmedValue) {
  const s = String(trimmedValue).trim()
  for (const prefix of FILTER_OPERATORS) {
    if (s.startsWith(prefix)) {
      return { operator: prefix, operand: s.slice(prefix.length).trim() }
    }
  }
  return { operator: null, operand: s }
}

function isNumericOperand(operand) {
  const n = Number(operand)
  return operand !== '' && !Number.isNaN(n) && Number.isFinite(n)
}

function itemValueMatches(actual, expectedTrimmed) {
  if (Array.isArray(actual)) {
    return actual.some((el) => itemValueMatches(el, expectedTrimmed))
  }
  if (actual === false && expectedTrimmed === 'false') {
    return true
  }
  if (actual === true && expectedTrimmed === 'true') {
    return true
  }
  const str = actual === null || actual === undefined ? '' : String(actual).trim()
  return str === expectedTrimmed || str.includes(expectedTrimmed)
}

function assertItemsMatchFilter(items, property, filterValues) {
  expect(items.length).toBeGreaterThan(0)
  const fv = String(filterValues[0]).trim()

  if (RELATIVE_DATE_VALUES.has(fv)) {
    const now = Date.now()
    const maxAgeMs = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000,
    }
    const lowerBound = now - maxAgeMs[fv]

    items.forEach((item) => {
      const value = item[property]
      expect(value).toBeDefined()
      expect(String(value).trim().length).toBeGreaterThan(0)
      const parsedTime = Date.parse(String(value))
      expect(Number.isNaN(parsedTime)).toBe(false)
      expect(parsedTime).toBeLessThanOrEqual(now)
      expect(parsedTime).toBeGreaterThanOrEqual(lowerBound)
    })
    return
  }

  const { operator, operand } = parseFilterValue(fv)
  if (operator && isNumericOperand(operand)) {
    const expectedNum = Number(operand)
    items.forEach((item) => {
      const actualNum = Number(item[property])
      expect(Number.isNaN(actualNum)).toBe(false)
      switch (operator) {
        case '=':
          expect(actualNum).toBe(expectedNum)
          break
        case '!=':
        case '!':
          expect(actualNum).not.toBe(expectedNum)
          break
        case '>':
          expect(actualNum).toBeGreaterThan(expectedNum)
          break
        case '<':
          expect(actualNum).toBeLessThan(expectedNum)
          break
        case '>=':
          expect(actualNum).toBeGreaterThanOrEqual(expectedNum)
          break
        case '<=':
          expect(actualNum).toBeLessThanOrEqual(expectedNum)
          break
        default:
          throw new Error(`Unsupported filter operator "${operator}" for ${property}=${fv}`)
      }
    })
    return
  }

  items.forEach((item) => {
    if (operator === '!=' || operator === '!') {
      expect(itemValueMatches(item[property], operand)).toBe(false)
    } else {
      expect(itemValueMatches(item[property], fv)).toBe(true)
    }
  })
}

describe('RHACM4K-1709: Search - Search using filters', () => {
  beforeAll(async () => {
    // Log in and get access token
    token = getKubeadminToken()

    // Create a route to access the Search API.
    searchApiRoute = await getSearchApiRoute()
  })

  var filtersRegistry = [
    { filters: [{ property: 'created', values: ['month'] }] },
    { filters: [{ property: 'apigroup', values: ['apps'] }] },
    { filters: [{ property: 'desired', values: ['=0'] }] },
    { filters: [{ property: 'current', values: ['=0'] }] },
    { filters: [{ property: 'ready', values: ['=0'] }] },
    { filters: [{ property: 'restarts', values: ['=0'] }] },
    { filters: [{ property: 'parallelism', values: ['=1'] }] },
    { filters: [{ property: 'completions', values: ['=1'] }] },
    { filters: [{ property: 'successful', values: ['=1'] }] },
    { filters: [{ property: 'updated', values: ['>0'] }] },
    { filters: [{ property: 'cpu', values: ['>0'] }] },
    { filters: [{ property: 'active', values: ['=0'] }] },
    { filters: [{ property: 'nodes', values: ['>0'] }] },
    { filters: [{ property: 'apiversion', values: ['v1'] }] },
    { filters: [{ property: 'container', values: ['acm-agent'] }] },
    {
      filters: [
        {
          property: 'podIP',
          values: [
            execSync("oc get pods -n openshift-console -o=jsonpath='{.items[0].status.podIP}'").toString().trim(),
          ],
        },
      ],
    },
    {
      filters: [
        {
          property: 'hostIP',
          values: [
            execSync("oc get pods -n openshift-console -o=jsonpath='{.items[0].status.hostIP}'").toString().trim(),
          ],
        },
      ],
    },
    {
      filters: [
        {
          property: 'kubernetesVersion',
          values: [execSync("oc get nodes -o=jsonpath='{.items[0].status.nodeInfo.kubeletVersion}'").toString().trim()],
        },
      ],
    },
    {
      filters: [
        {
          property: 'memory',
          values: [
            execSync("oc get managedclusters -o=jsonpath='{.items[0].status.capacity.memory}'").toString().trim(),
          ],
        },
      ],
    },
    { filters: [{ property: 'startedAt', values: ['month'] }] },
    { filters: [{ property: 'cluster', values: [getLocalClusterName()] }] },
    { filters: [{ property: 'type', values: ['ClusterIP'] }] },
    {
      filters: [
        {
          property: 'clusterIP',
          values: [
            execSync("oc get service --all-namespaces -o=jsonpath='{.items[0].spec.clusterIP}'").toString().trim(),
          ],
        },
      ],
    },
    { filters: [{ property: 'lastSchedule', values: ['month'] }] },
    {
      filters: [
        {
          property: 'architecture',
          values: [execSync("oc get nodes -o=jsonpath='{.items[0].status.nodeInfo.architecture}'").toString().trim()],
        },
      ],
    },
    {
      filters: [
        {
          property: 'osImage',
          values: [execSync("oc get nodes -o=jsonpath='{.items[0].status.nodeInfo.osImage}'").toString().trim()],
        },
      ],
    },
    {
      filters: [
        {
          property: 'consoleURL',
          values: [execSync('oc whoami --show-console').toString().trim()],
        },
      ],
    },
  ]

  filtersRegistry.forEach((value) => {
    test(`[P2][Sev2][${squad}] should filter by ${value.filters[0].property}`, async () => {
      const query = searchQueryBuilder(value)
      const res = await sendRequest(query, token)
      const items = res.body.data.searchResult[0].items
      assertItemsMatchFilter(items, value.filters[0].property, value.filters[0].values)
    }, 20000)
  })
})
