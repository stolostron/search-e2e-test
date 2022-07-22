/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad, tags } from '../config'
import { deployment, namespace } from '../../common-lib/resources'
import {
  cliHelper,
  generateNewMultiResourceState,
  resetNewMultiResourceState,
} from '../scripts/cliHelper'
import { searchPage, searchBar } from '../views/search'

const clusterModes = [
  { label: 'Local', valueFn: () => cy.wrap('local-cluster'), skip: false },
  {
    label: 'Managed',
    valueFn: () => cliHelper.getTargetManagedCluster(),
    skip: true,
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

  describe(
    `Search: Search in ${clusterMode.label} Cluster`,
    { tags: tags.env },
    function () {
      before(function () {
        // Resetting test state to new state.
        resetNewMultiResourceState(resources)

        // Setting the cluster mode cluster as the current instance cluster.
        clusterMode.valueFn().as('clusterName')
      })

      beforeEach(function () {
        // Generate new resource state for the test environment.
        generateNewMultiResourceState(resources, {
          kubeconfig: clusterMode.kubeconfig,
        })

        // Log into the cluster ACM console.
        cy.visitAndLogin('/multicloud/home/search')
      })

      after(function () {
        // Attempt to cleanup resources that were created during the test run execution.
        cliHelper.deleteResource(resources[0], {
          failOnNonZeroExit: false,
          kubeconfig: clusterMode.kubeconfig,
        })
      })

      context('UI - Search page validation', { tags: tags.modes }, function () {
        it(`[P1][Sev1][${squad}] should load and render the search page`, function () {
          searchPage.shouldLoad()
          searchPage.shouldRenderSavedSearchesTab()
          searchPage.shouldRenderSearchBar()
          searchPage.shouldRenderSuggestedSearches()
        })
      })

      context(
        'Verify: search results with common filter and condition',
        { tags: tags.modes },
        function () {
          beforeEach(function () {
            searchPage.shouldFindNamespaceInCluster(
              resources[1].namespace,
              this.clusterName
            )
          })

          it(`[P2][Sev2][${squad}] should work kind filter for deployment`, function () {
            searchBar.whenFilterByKind('deployment')
            searchPage.shouldFindResourceDetailItem(
              resources[1].kind,
              'auto-test-deploy',
              resources[1].namespace
            )
          })

          it(`[P2][Sev2][${squad}] should work kind filter for pod`, function () {
            searchBar.whenFilterByKind('pod')
            searchPage.shouldFindResourceDetailItem(
              'pod',
              'auto-test-deploy',
              resources[1].namespace
            )
          })

          it(`[P3][Sev3][${squad}] should have expected count of relationships`, function () {
            searchPage.whenExpandRelationshipTiles()
            searchPage.shouldFindRelationshipTile('cluster', 1)
            searchPage.shouldFindRelationshipTile('deployment', 1)
            searchPage.shouldFindRelationshipTile('pod', 1)
          })
        }
      )
    }
  )
})
