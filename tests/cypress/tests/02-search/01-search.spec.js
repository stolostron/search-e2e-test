/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../../config'
import { cliHelper } from '../../scripts/cliHelper'
import { searchPage, searchBar } from '../../views/search'

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
    skip: true,
    namespace: cliHelper.generateNamespace('', `managed-${Date.now()}`),
  },
]

// Prereq test suite. We need to create the resources for both cluster before we log into the UI.
cliHelper.setup(clusterModes)

clusterModes.forEach((clusterMode) => {
  if (clusterMode.skip) {
    return
  }

  describe('Search: Search in ' + clusterMode.label + ' Cluster', { tags: ['@CANARY', '@ROSA'] }, function () {
    before(function () {
      clusterMode.valueFn().as('clusterName')
    })

    // Log into cluster to clean up resources.
    after(function () {
      cliHelper.login(clusterMode.label)
      cliHelper.deleteNamespace(clusterMode.namespace)
    })

    // Logging into the hub cluster UI.
    if (clusterMode.label !== 'Managed') {
      context('prereq: user should log into the ACM console', { tags: ['@REQUIRED'] }, function () {
        it(`[P1][Sev1][${squad}] should login`, function () {
          cy.login()
        })
      })
    }

    context('search resources: verify resource exist after creation', { tags: ['@BVT'] },function () {
      beforeEach(function () {
        searchPage.whenGoToSearchPage()
        searchBar.whenFilterByNamespace(clusterMode.namespace)
        searchBar.whenFilterByCluster(this.clusterName)
        searchPage.shouldLoadResults()
      })

      it(`[P3][Sev3][${squad}] should have expected count of relationships`, function () {
        searchPage.whenExpandRelationshipTiles()
        searchPage.shouldFindRelationshipTile('cluster', '1')
        searchPage.shouldFindRelationshipTile('deployment', '1')
        searchPage.shouldFindRelationshipTile('pod', '1')
      })

      it(`[P1][Sev1][${squad}] should work kind filter for deployment`, function () {
        searchBar.whenFilterByKind('deployment')
        searchPage.shouldFindResourceDetailItem(
          'deployment',
          clusterMode.namespace + '-deployment'
        )
      })

      it(`[P1][Sev1][${squad}] should work kind filter for pod`, function () {
        searchBar.whenFilterByKind('pod')
        searchPage.shouldFindResourceDetailItem(
          'pod',
          clusterMode.namespace + '-deployment-'
        )
      })
    })
  })
})
