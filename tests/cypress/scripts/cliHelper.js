/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

export const cliHelper = {
    getTargetManagedCluster: () => {
      return cy.exec('oc get managedclusters -o custom-columns=NAME:.metadata.name').then(result => {
        const managedClusters = result.stdout.split('\n').slice(1)
        let targetCluster

        cy.log(`env: ${process.env.NODE_ENV}`)

        if (process.env.NODE_ENV !== 'development' || process.env.NODE_ENV !== 'debug') { // In the canary tests, we only need to focus on the import-xxxx managed cluster.
          targetCluster = managedClusters.find((c) => c.startsWith('import-'))

          if (targetCluster === undefined) { // Incase the cluster is not available, try testing on an available managed cluster.
            targetCluster = managedClusters.find((c) => !c.includes('local-cluster'))
          }

        } else { // We need to access a managed cluster locally.
          targetCluster = managedClusters.find((c) => !c.includes('local-cluster'))
        }

        cy.log(`Testing with Managed Cluster: ${targetCluster}`)
        return cy.wrap(targetCluster)
      })
    }
  }
