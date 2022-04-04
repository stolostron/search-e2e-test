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
 * @param {string} kubeconfig The kubeconfig file path to generate the resources state with. (Required: Managed cluster testing)
 * @param {object} options Additional options for generating the new resources state.
 * @param {...any} args Additional argument parameters for the state object.
 */
export const generateNewResourceState = (
  state,
  kubeconfig,
  options,
  ...args
) => {
  if (!Cypress.env(state.kind)) {
    cy.log(
      `Required ${state.kind} has not been created within this test instance. Preparing to create them.`
    )
    cliHelper.createResource(state, kubeconfig)
  } else {
    cy.log(
      `Detected that the required ${state.kind} resources has been created within this test instance.`
    )
  }

  if (options) {
    if (options.wait) {
      cy.log(`Option for waiting enabled for ${options.wait / 1000} seconds`)
      cy.wait(options.wait)
    }
  }
}

/**
 * Generate multiple new resource state for the kind objects that are required by the test environment.
 * @param {array} state Target state to generate required resources from.
 * @param {string} kubeconfig The kubeconfig file path to generate the resources state with. (Required: Managed cluster testing)
 * @param {object} options Additional options for generating the new resources state.
 * @param {...any} args Additional optional parameters for the state object.
 */
export const generateNewMultiResourceState = (
  state,
  kubeconfig,
  options,
  ...args
) => {
  state.forEach((s) => {
    if (!Cypress.env(s.kind)) {
      cy.log(
        `Required ${s.kind} has not been created within this test instance. Preparing to create them.`
      )
      cliHelper.createResource(s, kubeconfig)
    } else {
      cy.log(
        `Detected that the required ${s.kind} resources has been created within this test instance.`
      )
    }
  })

  if (options) {
    if (options.wait) {
      cy.log(`Option for waiting enabled for ${options.wait / 1000} seconds`)
      cy.wait(opitions.wait)
    }
  }
}

/**
 * Reset the state of the kind objects that are required by the test environment.
 * @param {array} state Targeted state to reset.
 * @param {...any} args Additional optional parameters for the state object.
 */
export const resetNewResourceState = (state, ...args) => {
  Cypress.env(state.kind, false)
}

/**
 * Reset the state of the kind objects that are required by the test environment.
 * @param {array} state Targeted state to reset.
 * @param {...any} args Additional optional parameters for the state object.
 */
export const resetNewMultiResourceState = (state, ...args) => {
  state.forEach((s) => {
    Cypress.env(s.kind, false)
  })
}

/**
 * Helper tool for managing resources created by the `oc` cli command.
 */
export const cliHelper = {
  /**
   * Create new instance of the resource object within the test cluster environment.
   * @param {object} resource The resource object to create. (Supported: application, deployment, namespace)
   * @param {string} kubeconfig The kubeconfig file to create the resource object. (Only required for managed cluster testing)
   */
  createResource: (resource, kubeconfig = '') => {
    // Build command line arguments for the resource creation.
    var cmd = `${kubeconfig} oc get ${resource.kind} ${resource.name}`

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
   * @param {string} kubeconfig The kubeconfig file to delete the resource object. (Only required for managed cluster testing)
   */
  deleteResource: (resource, kubeconfig = '') => {
    cy.log(`Preparing to cleanup ${resource.kind} created during test run.`)

    var resourceExist = false
    var cmd = `${kubeconfig} oc get ${resource.kind} ${resource.name}`

    if (resource.namespace) {
      cmd += ` -n ${resource.namespace.toLowerCase()}`
    }

    cy.exec(cmd, { failOnNonZeroExit: false }).then((res) => {
      if (!res.stderr) {
        cy.log(
          `${resource.kind}: ${resource.name} exist within the current cluster environment.`
        )
        resourceExist = true
      } else {
        cy.log(
          `${resource.kind}: ${resource.name} does not exist within the cluster environment. Skipping resource deletion.`
        )
      }

      if (resourceExist) {
        cmd = cmd.replace('oc get', 'oc delete')

        cy.exec(cmd).then((res) => {
          cy.log(res.stdout)
        })
      }
    })
  },

  /**
   * Generate namespace name for cluster environment.
   * @param {string} cluster The cluster environment to generate the namespace for.
   */
  generateNamespace: (cluster = 'hub') => {
    return `auto-search-${cluster}`
  },

  /**
   * Return the name of the managed test cluster environment that will be targeted during the test execution.
   * @returns {string} `targetCluster` The name of the managed test cluster environment.
   */
  getTargetManagedCluster: () => {
    var targetCluster

    if (Cypress.env('OPTIONS_MANAGED_CLUSTER_NAME')) {
      targetCluster = Cypress.env('OPTIONS_MANAGED_CLUSTER_NAME')

      cy.log(`Imported cluster name found: ${targetCluster}`)
      return cy.wrap(targetCluster)
    }

    return cy
      .exec('oc get managedclusters -o custom-columns=NAME:.metadata.name')
      .then((res) => {
        const managedClusters = res.stdout.split('\n').slice(1)

        if (
          managedClusters.length === 1 &&
          managedClusters.find((c) => c.includes('local-cluster'))
        ) {
          cy.log(
            `No imported cluster name found. Using local-cluster for testing.`
          )

          targetCluster = 'local-cluster'
          return cy.wrap(targetCluster)
        }

        // In the canary tests, we only need to focus on the import-xxxx managed cluster.
        if (
          Cypress.env('NODE_ENV') &&
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
   * Login into the cluster environment with the `oc` cli command.
   * @param {string} cluster The cluster environment to login into (Default: HUB).
   * @param {*} args Additional optional parameters for the login.
   */
  login: (cluster = 'HUB', ...args) => {
    cy.exec(
      `oc login --server=https://api.${Cypress.env(
        `OPTIONS_${cluster}_BASEDOMAIN`
      )}:6443 -u ${Cypress.env(`OPTIONS_${cluster}_USER`)} -p ${Cypress.env(
        `OPTIONS_${cluster}_PASSWORD`
      )} --insecure-skip-tls-verify`
    )
  },
}
