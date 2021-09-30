/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../../config'
import { cliHelper } from '../../scripts/cliHelper'
import { searchPage, searchBar } from '../../views/search'
import { podDetailPage } from '../../views/podDetailPage'

const clusterModes = [
  {
    label: 'Local',
    valueFn: () => cy.wrap('local-cluster'),
    skip: false,
    namespace: cliHelper.generateNamespace(),
  },
  {
    label: 'Managed',
    valueFn: () => cliHelper.getTargetManagedCluster(),
    skip: Cypress.env('SKIP_MANAGED_CLUSTER_TEST'),
    namespace: cliHelper.generateNamespace('', `managed-${Date.now()}`),
  },
]

// Prereq test suite. We need to create the resources for both cluster before we log into the UI.
cliHelper.setup(clusterModes)

clusterModes.forEach((clusterMode) => {
  if (clusterMode.skip) {
    return
  }

  describe('Search: Search in ' + clusterMode.label + ' Cluster', function () {
    before(function () {
      clusterMode.valueFn().as('clusterName')
    })

    // Log into cluster to clean up resources.
    after(function () {
      if (!Cypress.env(`USE_${clusterMode.label}_KUBECONFIG`)) {
        // Log into cluster with oc command.
        cliHelper.login(clusterMode.label)
      } else {
        // Switch context with kubeconfig file.
        cliHelper.useKubeconfig(clusterMode.label)
      }
      cliHelper.deleteNamespace(clusterMode.namespace)
    })

    // Logging into the hub cluster UI.
    if (clusterMode.label !== 'Managed') {
      context('prereq: user should log into the ACM console', function () {
        it(`[P1][Sev1][${squad}] should login`, function () {
          cy.login()
        })
      })
    }

    context(
      'search resources: verify resource deployment pod logs',
      function () {
        beforeEach(function () {
          searchPage.whenGoToSearchPage()
          searchBar.whenFilterByNamespace(clusterMode.namespace)
          searchBar.whenFilterByCluster(this.clusterName)
          searchPage.shouldLoadResults()
        })

        it(`[P2][Sev2][${squad}] should see pod logs`, function () {
          searchBar.whenFilterByKind('pod')
          searchPage.whenGoToResourceDetailItemPage(
            'pod',
            clusterMode.namespace + '-deployment'
          )
          podDetailPage.whenClickOnLogsTab()
          podDetailPage.shouldSeeLogs('serving on')
        })
      }
    )
  })
})
