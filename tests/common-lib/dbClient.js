// Copyright Contributors to the Open Cluster Management project

const { execSync } = require('child_process')
const { sleep } = require('./sleep')

/**
 * Execute a SQL query against the search-postgres database via oc exec.
 * @param {string} acmNamespace - The ACM namespace where search-postgres is deployed.
 * @param {string} sql - The SQL query to execute.
 * @returns {string} The trimmed query output.
 */
function execPostgresQuery(acmNamespace, sql) {
  return execSync(
    `oc exec -n ${acmNamespace} deploy/search-postgres -c search-postgres -- ` +
      `bash -c "psql -U \\$POSTGRESQL_USER -d \\$POSTGRESQL_DATABASE -tAc \\"${sql}\\""`,
  )
    .toString()
    .trim()
}

/**
 * Poll the search-postgres database until resources in the given namespace are indexed.
 * @param {string} acmNamespace - The ACM namespace where search-postgres is deployed.
 * @param {string} targetNamespace - The namespace to check for indexed resources.
 * @param {Object} [options]
 * @param {number} [options.minCount=1] - Minimum number of resources expected.
 * @param {number} [options.intervalMs=10000] - Poll interval in milliseconds.
 * @param {number} [options.timeoutMs=300000] - Maximum time to wait in milliseconds.
 * @returns {Promise<number>} The resource count once the threshold is met.
 */
async function waitForIndexedResources(
  acmNamespace,
  targetNamespace,
  options = {},
) {
  const { minCount = 1, intervalMs = 10000, timeoutMs = 300000 } = options
  const deadline = Date.now() + timeoutMs
  const sql = `SELECT count(*) FROM search.resources WHERE data->>'namespace' = '${targetNamespace}'`

  while (Date.now() < deadline) {
    try {
      const result = execPostgresQuery(acmNamespace, sql)
      const count = parseInt(result, 10)
      if (count >= minCount) {
        console.log(
          `[waitForIndexedResources] Found ${count} resources in namespace '${targetNamespace}'.`,
        )
        return count
      }
      console.log(
        `[waitForIndexedResources] ${count}/${minCount} resources indexed in '${targetNamespace}', retrying...`,
      )
    } catch (err) {
      console.log(
        `[waitForIndexedResources] Query failed: ${err.message}, retrying...`,
      )
    }
    await sleep(intervalMs)
  }

  throw new Error(
    `Timed out after ${timeoutMs / 1000}s waiting for ${minCount} resources in namespace '${targetNamespace}'.`,
  )
}

exports.execPostgresQuery = execPostgresQuery
exports.waitForIndexedResources = waitForIndexedResources
