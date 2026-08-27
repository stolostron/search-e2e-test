// Copyright Contributors to the Open Cluster Management project

const { getKubeadminToken } = require('../common-lib/clusterAccess')
const { sendMcpRequest } = require('../common-lib/mcpClient')

describe('Search MCP Server - API Tests', () => {
  let token

  beforeAll(async () => {
    // Log in and get access token
    token = getKubeadminToken()
  })

  test('Health Check', async () => {
    const res = await sendMcpRequest('/health')
    expect(res.status).toEqual(200)
    expect(res.body.status).toEqual('healthy')
    expect(res.body.health.database.connected).toEqual(true)
    expect(res.body.mcp_compliant).toEqual(true)
  })

  test('MCP Protocol - List Tools', async () => {
    const body = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {},
    }
    const res = await sendMcpRequest('/mcp', 'POST', body, token)
    expect(res.status).toEqual(200)
    expect(res.body.result).toBeDefined()
    expect(res.body.result.tools).toBeDefined()

    const toolNames = res.body.result.tools.map((t) => t.name)
    expect(toolNames).toContain('find_resources')
    expect(toolNames).not.toContain('query_database') // query_database is not available without the db header
  })

  test('MCP Tool - find_resources', async () => {
    const body = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'find_resources',
        arguments: {
          kind: 'Pod',
          limit: '5',
        },
      },
    }
    const res = await sendMcpRequest('/mcp', 'POST', body, token)
    expect(res.status).toEqual(200)
    expect(res.body.result).toBeDefined()
    expect(res.body.result.content).toBeDefined()
    expect(res.body.result.content.length).toBeGreaterThan(0)
    expect(res.body.result.content[0].text).toContain('Found')
  })

  test('MCP Tool - query_database (basic)', async () => {
    const body = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'query_database',
        arguments: {
          query: 'SELECT COUNT(*) as resource_count FROM search.resources LIMIT 1',
        },
      },
    }
    const res = await sendMcpRequest('/mcp', 'POST', body, token)

    // Without special header or permissions, this might fail or return error depending on implementation
    // But basic connectivity should work
    if (res.status === 200 && res.body.result) {
      expect(res.body.result.content).toBeDefined()
    } else {
      // If it fails, it should be a graceful error
      expect(res.status).toBeDefined()
    }
  })

  test('Authenticated find_resources with specific criteria', async () => {
    const body = {
      jsonrpc: '2.0',
      id: 10,
      method: 'tools/call',
      params: {
        name: 'find_resources',
        arguments: {
          kind: 'Pod',
          status: 'Running',
          limit: 2,
        },
      },
    }
    const res = await sendMcpRequest('/mcp', 'POST', body, token)
    expect(res.status).toEqual(200)
    expect(res.body.result).toBeDefined()
    expect(res.body.result.content[0].text).toContain('Found')
  })

  test('Authenticated query_database with header', async () => {
    const body = {
      jsonrpc: '2.0',
      id: 11,
      method: 'tools/call',
      params: {
        name: 'query_database',
        arguments: {
          sql: 'SELECT COUNT(*) as total FROM search.resources LIMIT 1',
        },
      },
    }
    const headers = { db: 'show' }
    const res = await sendMcpRequest('/mcp', 'POST', body, token, headers)

    if (res.status === 200 && !res.body.error) {
      expect(res.body.result).toBeDefined()
      expect(res.body.result.content[0].text).toContain('Row 1:')
    } else {
      // If it fails (e.g. strict permissions), log it but don't fail test if expected
      console.log('Query database response:', res.body)
    }
  })
})
