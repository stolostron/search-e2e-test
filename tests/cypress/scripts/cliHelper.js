/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/**
 * Return the captialized version of the string.
 * @param {string} string The string to be capitalized.
 * @return {string} Capitalized version of the string.
 */
export const capitalize = (string) =>
  string.charAt(0).toUpperCase() + string.slice(1)

/**
 * Generate a new resource state for the kind objects that are required by the test environment.
 * @param {object} state Target state to generate required resources from.
 * @param {object} options Additional options for generating the new resources state.
 */
export const generateNewResourceState = (state, options = {}) => {
  if (!Cypress.env(state.kind)) {
    cy.log(
      `Required ${state.kind} has not been created within this test instance. Preparing to create them.`
    )
    cliHelper.createResource(state, options)

    if (options.wait) {
      cy.log(
        `Option for waiting enabled for ${
          options.wait / 1000
        } seconds. Waiting to ensure resource is properly indexed.`
      )
      cy.wait(options.wait)
    }
  } else {
    cy.log(
      `Detected that the required ${state.kind} resources has been created within this test instance.`
    )
  }
}

/**
 * Generate multiple new resource state for the kind objects that are required by the test environment.
 * @param {array} state Target state to generate required resources from.
 * @param {object} options Additional options for generating the new resources state.
 */
export const generateNewMultiResourceState = (state, options = {}) => {
  state.forEach((s) => {
    generateNewResourceState(s, options)
  })
}

/**
 * Reset the state of the kind objects that are required by the test environment.
 * @param {array} state Targeted state to reset.
 * @param {object} options Additional options for resetting the new resources state.
 */
export const resetNewResourceState = (state, options = {}) => {
  Cypress.env(state.kind, false)
}

/**
 * Reset the state of the kind objects that are required by the test environment.
 * @param {array} state Targeted state to reset.
 * @param {object} options Additional options for resetting the new resources state.
 */
export const resetNewMultiResourceState = (state, options = {}) => {
  state.forEach((s) => {
    resetNewResourceState(s, options)
  })
}

/**
 * Helper tool for managing resources created by the `oc` cli command.
 */
export const cliHelper = {
  /**
   * Create new instance of the resource object within the test cluster environment.
   * @param {object} resource The resource object to create. (Supported: application, deployment, namespace)
   * @param {object} options Additional options for creating the new resources object.
   */
  createResource: (resource, options = {}) => {
    // Check to see if the kubeconfig file is required for creating the test resource.
    if (!options.kubeconfig) {
      cy.log('[INFO] No kubeconfig file specified for command.')
      options.kubeconfig = ''
    }

    // Build command line arguments for the resource creation.
    var cmd = `${options.kubeconfig} oc get ${resource.kind} ${resource.name}`

    // Check to see if the namespace was passed in the object.
    if (resource.namespace) {
      cmd += ` -n ${resource.namespace}`
    }

    cy.exec(cmd, { failOnNonZeroExit: false }).then((res) => {
      if (!res.stderr) {
        cy.log(
          `${resource.kind}: ${resource.name} exist within the current cluster environment.`
        )
        Cypress.env(resource.kind, true)
      } else {
        cy.log(
          `${resource.kind}: ${resource.name} does not exist within the cluster environment. Preparing to create ${resource.kind} resource.`
        )
        Cypress.env(resource.kind, false)
      }

      if (!Cypress.env(resource.kind)) {
        cmd = cmd.replace('oc get', 'oc create')

        // Check to see if the image was passed in the object.
        if (resource.image) {
          cmd += ` --image ${resource.image}`
        }

        if (resource.kind == 'application') {
          cy.readFile('tests/cypress/templates/application.yaml').then(
            (cfg) => {
              let b64Cfg = btoa(
                cfg
                  .replaceAll('APPNAME', resource.name)
                  .replaceAll('NAMESPACE', resource.namespace)
              )
              cy.exec(`echo ${b64Cfg} | base64 -d | oc apply -f -`).then(() => {
                Cypress.env(resource.kind, true)
              })
            }
          )
        } else {
          cy.exec(cmd).then(() => {
            Cypress.env(resource.kind, true)
          })
        }
      }
    })
  },

  /**
   * Delete instance of the resource object within the test cluster environment.
   * @param {object} resource The resource object to delete.
   * @param {object} options Additional options for deleting the resource object.
   */
  deleteResource: (resource, options = { failOnNonZeroExit: true }) => {
    cy.log(`Preparing to cleanup ${resource.kind} created during test run.`)
    var resourceExist = false

    if (!options.kubeconfig) {
      cy.log('[INFO] No kubeconfig file specified for command.')
      options.kubeconfig = ''
    }

    var cmd = `${options.kubeconfig} oc get ${resource.kind} ${resource.name}`

    if (resource.namespace) {
      cmd += ` -n ${resource.namespace}`
    }

    cy.exec(cmd, { failOnNonZeroExit: false }).then((res) => {
      if (!res.stderr) {
        cy.log(
          `${resource.kind}: ${resource.name} exist within the current cluster environment. Deleting it now.`
        )
        resourceExist = true
      } else {
        cy.log(
          `${resource.kind}: ${resource.name} does not exist within the cluster environment. Skipping resource deletion.`
        )
      }

      if (resourceExist) {
        cmd = cmd.replace('oc get', 'oc delete')

        cy.exec(cmd, { failOnNonZeroExit: options.failOnNonZeroExit }).then(
          (res) => {
            if (res.stderr) {
              cy.log('[ERROR]', res.stderr)
            } else {
              cy.log(res.stdout)
            }
          }
        )
      }
    })
  },
  /**
   * Return the name of the managed test cluster environment that will be targeted during the test execution.
   * @returns {string} `targetCluster` The name of the managed test cluster environment.
   * @param {object} options Additional options for getting the target managed cluster.
   */
  getTargetManagedCluster: () => {
    if (Cypress.env('OPTIONS_MANAGED_CLUSTER_NAME')) {
      cy.log(
        `Imported cluster name found: ${Cypress.env(
          'OPTIONS_MANAGED_CLUSTER_NAME'
        )}`
      )
      return cy.wrap(Cypress.env('OPTIONS_MANAGED_CLUSTER_NAME'))
    }

    return cy
      .exec('oc get managedclusters -o custom-columns=NAME:.metadata.name')
      .then((result) => {
        const managedClusters = result.stdout.split('\n').slice(1)
        var targetCluster

        if (
          managedClusters.length === 1 &&
          managedClusters.find((c) => c.includes('local-cluster'))
        ) {
          cy.log(
            `No imported cluster name found. Using local-cluster for testing.`
          )
          return cy.wrap((targetCluster = 'local-cluster'))
        }

        // In the canary tests, we only need to focus on the import-xxxx managed cluster.
        if (
          Cypress.env('NODE_ENV') !== 'development' &&
          Cypress.env('NODE_ENV') !== 'debug'
        ) {
          targetCluster = managedClusters.find(
            (c) =>
              c.startsWith('canary-') ||
              c.includes('canary') ||
              c.startsWith('import-')
          )
        }

        // When running locally or if the cluster is not available, try testing on an available managed cluster.
        if (targetCluster === undefined) {
          targetCluster = managedClusters.find(
            (c) => !c.includes('local-cluster')
          )
        }

        cy.log(`Testing with Managed Cluster: ${targetCluster}`)
        return cy.wrap(targetCluster)
      })
  },
  /**
   * Generate namespace name for cluster environment.
   * @param {string} cluster The cluster environment to generate the namespace for.
   * @param {object} options Additional options for generating the name for the namespace instance.
   * @return {string} The namespace name.
   */
  generateNamespace: (cluster = 'hub', options = {}) => {
    return `auto-search-${cluster}`
  },
  /**
   * Login into the cluster environment with the `oc` cli command.
   * @param {string} cluster The cluster environment to login into (Default: HUB).
   * @param {object} options Additional options for logging into the cluster environment.
   */
  login: (cluster = 'HUB', options = {}) => {
    var cmd = `oc login --server=https://api.${Cypress.env(
      `OPTIONS_${cluster}_BASEDOMAIN`
    )}:6443 -u ${Cypress.env(`OPTIONS_${cluster}_USER`)} -p ${Cypress.env(
      `OPTIONS_${cluster}_PASSWORD`
    )}`

    if (options.useInsecure) {
      cy.log('[INFO] useInsecure was set to true. Using insecure login.')
      cmd += ` --insecure-skip-tls-verify`
    }

    cy.exec(cmd)
  },
}
