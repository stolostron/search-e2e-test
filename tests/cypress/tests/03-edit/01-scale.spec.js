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
import { deploymentDetailPage } from '../../views/deploymentDetailPage'

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

  describe(
    `RHACM4K-1574: Search: Search in ${clusterMode.label} Cluster`,
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
        cy.visitAndLogin('/multicloud/welcome')

        // Generate new resource state for the test environment.
        generateNewMultiResourceState(resources)
        searchPage.whenGoToSearchPage()
      })

      after(function () {
        // Attempt to cleanup resources that were created during the test run execution.
        cliHelper.deleteResource(resources[0], {
          failOnNonZeroExit: false,
          kubeconfig: clusterMode.kubeconfig,
        })
      })

      context(
        'search resources: verify edit yaml function and scale resources',
        { tags: tags.modes },
        function () {
          beforeEach(function () {
            searchPage.shouldFindNamespaceInCluster(
              resources[1].namespace,
              this.clusterName
            )
          })

          it(`[P2][Sev2][${squad}] should delete pod`, function () {
            searchBar.whenFilterByKind('pod')
            searchPage.whenDeleteResourceDetailItem('pod', 'auto-test-deploy')
            searchPage.shouldFindResourceDetailItemCreatedFewSecondsAgo(
              'pod',
              'auto-test-deploy'
            )
          })

          it(`[P3][Sev3][${squad}] should edit yaml and scale deployment`, function () {
            searchBar.whenFilterByKind('deployment')
            searchPage.whenGoToResourceDetailItemPage(
              'deployment',
              'auto-test-deploy'
            )
            deploymentDetailPage.whenScaleReplicasTo(2)
          })

          it(`[P3][Sev3][${squad}] should verify that the deployment scaled`, function () {
            searchBar.whenFilterByKind('deployment')
            searchPage.whenGetResourceTableRow('deployment', 'auto-test-deploy')
            searchPage.shouldFindRelationshipTile('pod', '2')
          })
        }
      )
    }
  )
})
