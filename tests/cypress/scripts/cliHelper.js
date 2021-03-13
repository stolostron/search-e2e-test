/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

export const cliHelper = {
    getTargetManagedCluster: () => {
      return cy.exec('oc get managedclusters -o custom-columns=NAME:.metadata.name').then(result => {
        cy.log(`env: ${process.env.NODE_ENV}`)
        const managedClusters = result.stdout.split('\n').slice(1)
        let targetCluster

        // In the canary tests, we only need to focus on the import-xxxx managed cluster.
        if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'debug') {
          targetCluster = managedClusters.find((c) => c.startsWith('import-'))
        }
        
        // When running locally or if the cluster is not available, try testing on an available managed cluster.
        if (targetCluster === undefined) {
          targetCluster = managedClusters.find((c) => !c.includes('local-cluster'))
        }

        cy.log(`Testing with Managed Cluster: ${targetCluster}`)
        return cy.wrap(targetCluster)
      })
    }
  }
