/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

export const clusterModes = [{ label: 'Local', valueFn: () => cy.wrap('local-cluster'), skip: false },
 { label: 'Managed', valueFn: () => cliHelper.getTargetManagedCluster(), skip: true }];

export const cliHelper = {
    getTargetManagedCluster: () => {
      return cy.exec('oc get managedclusters -o custom-columns=NAME:.metadata.name').then(result => {
        const managedClusters = result.stdout.split('\n').slice(1)
        let targetCluster

        // In the canary tests, we only need to focus on the import-xxxx managed cluster.
        if (Cypress.env('NODE_ENV') !== 'development' && Cypress.env('NODE_ENV') !== 'debug') {
          targetCluster = managedClusters.find((c) => c.startsWith('import-'))
        }
        
        // When running locally or if the cluster is not available, try testing on an available managed cluster.
        if (targetCluster === undefined) {
          targetCluster = managedClusters.find((c) => !c.includes('local-cluster'))
        }

        cy.log(`Testing with Managed Cluster: ${targetCluster}`)
        return cy.wrap(targetCluster)
      })
    },
    createNamespaceAndDeployment: (namespace) => {
      cliHelper.createNamespace(namespace)
      cliHelper.createResource('deployment', namespace + '-deployment', namespace, 'openshift/hello-openshift')
      cy.logout()
      cy.login()
    },
    createNamespace: (name) => {
      cy.exec(`oc create namespace ${name}`)
    },
    deleteNamespace: (name) => {
      cy.exec(`oc delete namespace ${name}`)
    },
    createResource: (kind, name, namespace, image) => {
      cy.readFile(`tests/cypress/templates/${kind}.yaml`).then((cfg) => {
        let b64Cfg = btoa(cfg.replaceAll('APPNAME', name).replaceAll('NAMESPACE', namespace)).replace('IMAGE', image)
        cy.exec(`echo ${b64Cfg} | base64 -d | oc apply -f -`)
      })
    },
    deleteResource: (kind, name, namespace) => {
      cy.exec(`oc delete ${kind} ${name} -n ${namespace}`)
    },
    loginToCluster: (mode) => {
      const options = {
        BASEDOMAIN: mode === 'Local' ? 'OPTIONS_HUB_BASEDOMAIN' : 'OPTIONS_MANAGED_BASEDOMAIN',
        USER: mode === 'Local' ? 'OPTIONS_HUB_USER' : 'OPTIONS_MANAGED_USER',
        PASSWORD: mode === 'Local' ? 'OPTIONS_HUB_PASSWORD' : 'OPTIONS_MANAGED_PASSWORD',
      }

      cy.exec(`oc login --server=https://api.${Cypress.env(options.BASEDOMAIN)}:6443 -u ${Cypress.env(options.USER)} -p ${Cypress.env(options.PASSWORD)} --insecure-skip-tls-verify`)
    }
  }
