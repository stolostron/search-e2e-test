// Copyright Contributors to the Open Cluster Management project

const { getResourcesFromSearch } = require('./searchClient')
const { getResourcesFromOC } = require('./index')
const { sleep } = require('./sleep')

/**
 * Common function to validate that the data in search matches
 * the data in Kubernetes.
 * @param {string} kind The resource object kind that will be used for testing.
 * @param {string} apigroup The apigroup of the object kind.
 * @param {*} cluster The cluster of the object kind.
 * @param {string} namespace The namespace of the object kind.
 */
async function ValidateSearchData({
  user,
  kind,
  apigroup = '',
  cluster = { type: 'hub', name: 'local-cluster' },
  namespace = '--all-namespaces',
  retries = 12, // Default to 12 because some tests create namespaces and RBAC cache takes up to 60 seconds to update.
  retryWait = 5000,
}) {
  const [kube, search] = await Promise.all([
    getResourcesFromOC({ user, kind, apigroup, namespace, cluster }),
    getResourcesFromSearch({ userToken: user && user.token, kind, apigroup, namespace, cluster }),
  ])

  var missingInSearch = kube.filter((k) => !search.find((s) => s.name == k.name))
  var unexpectedInSearch = search.filter((s) => !kube.find((k) => s.name == k.name))

  // TODO: optimization: Check if any missingInSearch resources were created more than 1 minute ago and fail without retry.

  // Why we retry 12 times? Some tests are creating new namespaces. Data is indexed within a few seconds,
  // but the RBAC cache takes up to 60 seconds to update and include the new namespace.
  for (var retry = 0; (missingInSearch.length > 0 || unexpectedInSearch.length > 0) && retry <= retries; retry++) {
    await sleep(retryWait)

    const [retryKube, retrySearch] = await Promise.all([
      getResourcesFromOC({ user, kind, apigroup, namespace, cluster }),
      getResourcesFromSearch({ userToken: user && user.token, kind, apigroup, namespace, cluster }),
    ])

    // Validate missingInSearch resources using data after retry.
    missingInSearch = missingInSearch.filter(
      (r) =>
        // Keep missing resource if it doesn't appear in new search result.
        !retrySearch.find((s) => r.name == s.name) ||
        // Keep missing resource if it continues to appear in new kube result.
        retryKube.find((k) => r.name == k.name)
    )

    // Validate unexpectedInSearch resources using data after retry.
    unexpectedInSearch = unexpectedInSearch.filter(
      (r) =>
        // Keep unexpected resource if continues to appear in the new search result.
        retrySearch.find((s) => r.name == s.name) ||
        // Keep unexpected resource if it doesn't appear in the new kube result.
        !retryKube.find((k) => r.name == k.name)
    )
  }

  // Log error to help debug this test.
  if (missingInSearch.length > 0 || unexpectedInSearch.length > 0) {
    const msg = `Search data validation failed, but the test may no fail because Jest will retry.
    > Validation parameters: ${JSON.stringify({ user, kind, apigroup, namespace, cluster })}
    > MissingInSearch:       ${JSON.stringify(missingInSearch)}
    > UnexpectedInSearch:    ${JSON.stringify(unexpectedInSearch)}`
    console.log(msg)
  }
  // > Resource { kind: ${kind} apigroup: ${apigroup && apigroup.name} namespace:${namespace} cluster:${cluster && cluster.name},
  expect(missingInSearch).toEqual([])
  expect(unexpectedInSearch).toEqual([])
}

exports.ValidateSearchData = ValidateSearchData
// Use this timeout in tests that use this validation to account for the retry time.
// Keep timeout above 60s to account for RBAC cache refresh.
exports.validationTimeout = 90000
