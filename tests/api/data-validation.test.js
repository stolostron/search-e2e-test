// Copyright Contributors to the Open Cluster Management project

jest.retryTimes(global.retry, { logErrorsBeforeRetry: true })

const squad = require('../../config').get('squadName')
const { getKubeConfig, getToken, getSearchApiRoute } = require('../common-lib/clusterAccess')

const { fetchAPIResourcesWithListWatchMethods, getClusterList, shouldUseAPIGroup } = require('../common-lib/index')

const { ValidateSearchData, validationTimeout } = require('../common-lib/validateSearchData')

// Set list to ignore resources that aren't being collected by Search.
// When using the oc command clusterclaim doesn't include the namespace, therefore, for testing purposes, we will omit that resource object.
const ignoreKindResourceList = ['clusterclaim', 'event', 'networkattachmentdefinition']

// Set list of resources that require filtering by api group.
const requireAPIGroup = []

describe(`[P2][Sev2][${squad}] Search API: Validate data in index`, () => {
  // Get kubeconfig for cluster environments.
  var kubeconfigs = getKubeConfig()

  // Generate list of clusters.
  const clusterList = getClusterList(kubeconfigs)

  // Fetch API resources and filter out the kinds that aren't collected by search.
  console.info("Ignoring resources that aren't collected by Search:", ignoreKindResourceList)
  const resourceList = fetchAPIResourcesWithListWatchMethods().filter(
    (resource) => !ignoreKindResourceList.includes(resource.kind)
  )

  // Run tests for each test cluster environment.
  clusterList.forEach((cluster) => {
    if (!cluster.skip) {
      describe(`for cluster ${cluster.name}`, () => {
        beforeAll(async () => {
          // Log in and get access token
          user = {
            token: getToken(),
          }

          // Create a route to access the Search API.
          searchApiRoute = await getSearchApiRoute()
        })

        // This test checks the validation logic in case that a CRD gets removed.
        test(
          `check for a CRD that doesn't exist [kind:MissingCRD]`,
          async () => ValidateSearchData({ user, kind: 'MissingCRD', cluster: { name: 'local-cluster' } }),
          validationTimeout
        )

        resourceList.forEach((resource) => {
          // There can be multiple occurrences of the same resource kind with different API groups; therefore
          // if we detect multiple versions of the same resource we will then test based upon API groups.
          var group = {
            name: resource.apigroup,
            useAPIGroup: shouldUseAPIGroup(resource.kind, resourceList, requireAPIGroup),
          }

          test(
            `resource ${resource.kind}.${group.name || ''}`,
            async () => ValidateSearchData({ user, kind: resource.kind, apigroup: group, cluster }),
            validationTimeout
          )
        })
      })
    } else {
      console.log(`Skiping data-validation test for cluster ${JSON.stringify(cluster)}`)
    }
  })
})
