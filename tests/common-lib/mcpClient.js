// Copyright Contributors to the Open Cluster Management project

const request = require('supertest')

/**
 * Send a HTTP request to the MCP server.
 * @param {string} endpoint The endpoint to request (e.g., '/mcp', '/health')
 * @param {string} method The HTTP method (GET, POST)
 * @param {object} body The request body
 * @param {string} token The validation token to use for the request.
 * @param {object} headers Additional headers
 */
function sendMcpRequest(endpoint, method = 'GET', body = null, token = null, headers = {}) {
  // Disable SSL validation so we can connect to the route.
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0

  const mcpServerRoute = 'https://acm-mcp-server-acm-search.apps.sno-4xlarge-421-qx6h7.dev07.red-chesterfield.com'
  const req = request(mcpServerRoute)

  let r
  if (method === 'GET') {
    r = req.get(endpoint)
  } else if (method === 'POST') {
    r = req.post(endpoint).send(body)
  }

  if (token) {
    r.set('Authorization', `Bearer ${token}`)
  }

  for (const [key, value] of Object.entries(headers)) {
    r.set(key, value)
  }

  return r
}

module.exports = {
  sendMcpRequest,
}
