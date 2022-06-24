/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad, tags } from '../../config'
import { deployment, namespace } from '../../../common-lib/resources'
import {
  cliHelper,
  generateNewMultiResourceState,
  resetNewMultiResourceState,
} from '../../scripts/cliHelper'
import { searchPage, searchBar } from '../../views/search'

const clusterModes = [
  {
    label: 'Local',
    valueFn: () => cy.wrap('local-cluster'),
    skip: false,
  },
  {
    label: 'Managed',
    valueFn: () => cliHelper.getTargetManagedCluster(),
    skip: Cypress.env('SKIP_MANAGED_CLUSTER_TEST'),
    kubeconfig: `KUBECONFIG=${Cypress.env('OPTIONS_MANAGED_KUBECONFIG')}`,
  },
]

clusterModes.forEach((clusterMode) => {
  if (clusterMode.skip) {
    return
  }

  // Generate namespace for test resources.
  const ns =
    clusterMode.label === 'Local'
      ? cliHelper.generateNamespace()
      : cliHelper.generateNamespace('managed')

  // Generate resources for the test instance.
  const resources = [namespace(ns), deployment(ns)]

  describe.skip(
    'RHACKM4K-726: Search: Search in ' + clusterMode.label + ' Cluster',
    { tags: tags.env },
    function () {
      before(function () {
        // Resetting test state to new state.
        resetNewMultiResourceState(resources)

        // Setting the cluster mode cluster as the current instance cluster.
        clusterMode.valueFn().as('clusterName')
      })

      beforeEach(function () {
        // Log into the cluster ACM console.
        cy.visitAndLogin('/multicloud/home/welcome')

        // Generate new resource state for the test environment.
        generateNewMultiResourceState(resources, {
          kubeconfig: clusterMode.kubeconfig,
        })
        searchPage.whenGoToSearchPage()
      })

      context(
        'search resource: verify delete function in search result',
        { tags: tags.modes },
        function () {
          it(`[P2][Sev2][${squad}] should delete deployment`, function () {
            searchPage.shouldFindNamespaceInCluster(
              resources[1].namespace,
              this.clusterName
            )
            searchPage.shouldFindResourceInKind(
              resources[1].kind,
              resources[1].name
            )
            searchPage.whenDeleteResourceDetailItem(
              resources[1].kind,
              resources[1].name,
              resources[1].namespace
            )
          })

          it(`[P2][Sev2][${squad}] should validate deployment was deleted`, function () {
            searchBar.whenFilterByKind(resources[1].kind, true)
            searchBar.whenFilterByName(resources[1].name, true)
            searchPage.shouldFindNoResults()
          })

          it(`[P2][Sev2][${squad}] should delete namespace`, function () {
            searchPage.whenDeleteNamespace(
              this.clusterName,
              resources[1].namespace
            )
          })

          it(`[P2][Sev2][${squad}] should validate namespace was deleted`, function () {
            searchBar.whenFilterByNamespace(resources[1].namespace, true)
            searchPage.shouldFindNoResults()
          })
        }
      )
    }
  )
})
