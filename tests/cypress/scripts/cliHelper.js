/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

export const cliHelper = {
    getTargetManagedCluster: () => {
      return cy.exec('oc get managedclusters -o custom-columns=NAME:.metadata.name').then(result => {
        const managedClusters = result.stdout.split('\n').slice(1)
        const targetCluster = managedClusters.find(c => !c.includes('local-cluster') && !c.includes('console-ui-test-'))
        return cy.wrap(targetCluster)
      })
    }
  }
