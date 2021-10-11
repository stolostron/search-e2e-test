/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

import { squad, tags } from '../config'

export const cliHelper = {
  getTargetManagedCluster: () => {
    if (Cypress.env('OPTIONS_MANAGED_CLUSTER_NAME')) {
      cy.log(`Imported cluster name found: ${Cypress.env('OPTIONS_MANAGED_CLUSTER_NAME')}`)
      return cy.wrap(Cypress.env("OPTIONS_MANAGED_CLUSTER_NAME"))
    }

    return cy
      .exec('oc get managedclusters -o custom-columns=NAME:.metadata.name')
      .then((result) => {
        const managedClusters = result.stdout.split('\n').slice(1)
        var targetCluster

        if (managedClusters.length === 1 && managedClusters.find((c) => c.includes('local-cluster'))) {
          cy.log(`No imported cluster name found. Using local-cluster for testing.`)
          return cy.wrap(targetCluster = 'local-cluster')
        }

        // In the canary tests, we only need to focus on the import-xxxx managed cluster.
        if (
          Cypress.env('NODE_ENV') !== 'development' &&
          Cypress.env('NODE_ENV') !== 'debug'
        ) {
          targetCluster = managedClusters.find((c) => c.startsWith('canary-') || c.startsWith('import-'))
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
  generateNamespace: (prefix, postfix) => {
    return `${prefix ? prefix : 'search'}-${postfix ? postfix : Date.now()}`
  },
  createNamespace: (name) => {
    cy.exec(`oc create namespace ${name}`, {
      failOnNonZeroExit: false,
    }).then((res) => {
      cy.log(res.stdout ? res.stdout : res.stderr)
    })
  },
  createDeployment: (name, namespace, image) => {
    cy.exec(`oc create deployment ${name} --image=${image} -n ${namespace}`, {
      failOnNonZeroExit: false,
    }).then((res) => {
      cy.log(res.stdout ? res.stdout : res.stderr)
    })
  },
  createApplication: (appName, namespace) => {
    cy.readFile('tests/cypress/templates/application.yaml').then((cfg) => {
      let b64Cfg = btoa(
        cfg.replaceAll('APPNAME', appName).replaceAll('NAMESPACE', namespace)
      )
      cy.exec(`echo ${b64Cfg} | base64 -d | oc apply -f -`)
      cy.log(`Successfully created application (${appName})`)
    })
  },
  deleteNamespace: (name) => {
    cy.exec(`oc delete namespace ${name}`, { failOnNonZeroExit: false }).then(
      (res) => {
        cy.log(res.stdout ? res.stdout : res.stderr)
      }
    )
  },
  login: (mode) => {
    var mode = mode === 'Local' ? 'HUB' : 'MANAGED'
    cy.exec(
      `oc login --server=https://api.${Cypress.env(
        `OPTIONS_${mode}_BASEDOMAIN`
      )}:6443 -u ${Cypress.env(`OPTIONS_${mode}_USER`)} -p ${Cypress.env(
        `OPTIONS_${mode}_PASSWORD`
      )} --insecure-skip-tls-verify`
    )
  },
  setup: (modes) => {
    modes.forEach((mode) => {
      if (!mode.skip) {
        describe(`Search: Create resource in ${mode.label} Cluster`, { tags: tags.environments }, function () {
          // Log into the hub and managed cluster with the oc command to create the resources.
          context(`prereq: create resource with oc command`, { tags: tags.required }, function () {
            it(`[P1][Sev1][${squad}] should log into ${mode.label.toLocaleLowerCase()} cluster`, function () {
              cliHelper.login(mode.label)
            })
  
            it(`[P1][Sev1][${squad}] should create namespace resource`, function () {
              cliHelper.createNamespace(mode.namespace)
            })
  
            it(`[P1][Sev1][${squad}] should create deployment resource`, function () {
              cliHelper.createDeployment(
                mode.namespace + '-deployment',
                mode.namespace,
                'openshift/hello-openshift'
              )
            })
          })
        })
      }
    })
  },
}
