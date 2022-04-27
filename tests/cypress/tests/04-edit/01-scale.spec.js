/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad, tags } from '../../config'
import { cliHelper } from '../../scripts/cliHelper'
import { searchPage, searchBar } from '../../views/search'
import { deploymentDetailPage } from '../../views/deploymentDetailPage'

const clusterModes = [
  {
    label: 'Local',
    valueFn: () => cy.wrap('local-cluster'),
    skip: false,
    namespace: cliHelper.generateNamespace(),
    kubeconfig: Cypress.env('USE_HUB_KUBECONFIG')
      ? `KUBECONFIG=${Cypress.env('OPTIONS_HUB_KUBECONFIG')}`
      : '',
  },
  {
    label: 'Managed',
    valueFn: () => cliHelper.getTargetManagedCluster(),
    skip: Cypress.env('SKIP_MANAGED_CLUSTER_TEST'),
    namespace: cliHelper.generateNamespace('', `managed-${Date.now()}`),
    kubeconfig: Cypress.env('USE_MANAGED_KUBECONFIG')
      ? `KUBECONFIG=${Cypress.env('OPTIONS_MANAGED_KUBECONFIG')}`
      : '',
  },
]

// Prereq test suite. We need to create the resources for both cluster before we log into the UI.
cliHelper.setup(clusterModes)

clusterModes.forEach((clusterMode) => {
  if (clusterMode.skip) {
    return
  }

  describe(
    'RHACM4K-1574: Search: Search in ' + clusterMode.label + ' Cluster',
    { tags: tags.env },
    function () {
      before(function () {
        clusterMode.valueFn().as('clusterName')
      })

      // Log into cluster to clean up resources.
      after(function () {
        if (
          clusterMode.label === 'Managed' &&
          Cypress.env('USE_MANAGED_KUBECONFIG')
        ) {
          cy.log('Skipping login and using import-kubeconfig file')
        } else {
          // Log into cluster with oc command.
          cliHelper.login(clusterMode.label)
        }
        cliHelper.deleteNamespace(clusterMode.namespace, clusterMode.kubeconfig)
      })

      // Logging into the hub cluster UI.
      if (clusterMode.label !== 'Managed') {
        context(
          'prereq: user should log into the ACM console',
          { tags: tags.required },
          function () {
            it(`[P1][Sev1][${squad}] should login`, function () {
              cy.visitAndLogin('/multicloud/home/welcome')
            })
          }
        )
      }

      context(
        'search resources: verify edit yaml function and scale resources',
        { tags: tags.modes },
        function () {
          beforeEach(function () {
            cliHelper.checkIfLoggedIn()
            searchPage.whenGoToSearchPage()
            searchBar.whenFilterByNamespace(clusterMode.namespace)
            searchBar.whenFilterByCluster(this.clusterName)
            searchPage.shouldLoadResults()
          })

          it(`[P2][Sev2][${squad}] should delete pod`, function () {
            searchBar.whenFilterByKind('pod')
            searchPage.whenDeleteResourceDetailItem(
              'pod',
              clusterMode.namespace + '-deployment'
            )
            searchPage.shouldBeResourceDetailItemCreatedFewSecondsAgo(
              'pod',
              clusterMode.namespace + '-deployment'
            )
          })

          it(`[P3][Sev3][${squad}] should edit yaml and scale deployment`, function () {
            searchBar.whenFilterByKind('deployment')
            searchPage.whenGoToResourceDetailItemPage(
              'deployment',
              clusterMode.namespace + '-deployment'
            )
            deploymentDetailPage.whenScaleReplicasTo(2)
          })

          it(`[P3][Sev3][${squad}] should verify that the deployment scaled`, function () {
            searchBar.whenFilterByKind('deployment')
            searchPage.whenGetResourceTableRow(
              'deployment',
              clusterMode.namespace + '-deployment'
            )
            searchPage.shouldFindRelationshipTile('pod', '2')
          })
        }
      )
    }
  )
})
