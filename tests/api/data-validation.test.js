// Copyright Contributors to the Open Cluster Management project

jest.retryTimes(global.retry)

const squad = require('../../config').get('squadName')
const {
  getKubeConfig,
  getToken,
  getSearchApiRoute,
} = require('../common-lib/clusterAccess')

const {
  fetchAPIResourcesWithListWatchMethods,
  getClusterList,
  shouldUseAPIGroup,
} = require('../common-lib/index')

const { ValidateSearchData } = require('../common-lib/validateSearchData')

// Set list to ignore resources that aren't being collected by Search.
// When using the oc command clusterclaim doesn't include the namespace, therefore, for testing purposes, we will omit that resource object.
const ignoreKindResourceList = [
  'clusterclaim',
  'event',
  'networkattachmentdefinition',
]

// Set list of resources that require filtering by api group.
const requireAPIGroup = []


describe(`[P2][Sev2][${squad}] Search API: Validate data in index`, () => { 
  // Get kubeconfig for cluster environments.
  var kubeconfigs = getKubeConfig()

  // Generate list of clusters.
  const clusterList = getClusterList(kubeconfigs)

  // Fetch API resources and filter out the kinds that aren't collected by search.
  console.info(
    "Ignoring resources that aren't collected by Search:",
    ignoreKindResourceList
  )
  const resourceList = fetchAPIResourcesWithListWatchMethods().filter(
    (resource) => !ignoreKindResourceList.includes(resource.kind)
  )


  // Run tests for each test cluster environment.
  clusterList.forEach((cluster) => {
    if (!cluster.skip) {
      describe(`for cluster ${cluster.name}`, () => {
        beforeAll(async () => {
          // Log in and get access token
          token = getToken()
      
          // Create a route to access the Search API.
          searchApiRoute = await getSearchApiRoute()
        })
        resourceList.forEach((resource) => {
          // There can be multiple occurrences of the same resource kind with different API groups; therefore
          // if we detect multiple versions of the same resource we will then test based upon API groups.
          var group = {
            name: resource.apigroup,
            useAPIGroup: shouldUseAPIGroup(
              resource.kind,
              resourceList,
              requireAPIGroup
            ),
          }
          
          test(`resource ${resource.kind}.${group.name || ''}`,
            async () => ValidateSearchData(resource.kind, group, cluster),
            60000)
        })
      })
    } else {
      console.warn(
        `Detected skip option set to ${cluster.skip}. Proceeding to skip the API test for cluster ${cluster.name} with type ${cluster.type}.`
      )
    }
  })
})
