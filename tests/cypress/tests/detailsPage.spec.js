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
// import { deploymentDetailPage } from '../views/deploymentDetailPage'
import { podDetailPage } from '../views/podDetailPage'

// Generate namespace for test resources.
const ns = cliHelper.generateNamespace()

// Generate resources for the test instance.
const resources = [namespace(ns), deployment(ns)]

describe('Search: Search in Local Cluster', { tags: tags.env }, function () {
  before(function () {
    // Resetting test state to new state.
    resetNewMultiResourceState(resources)

    // Setting the cluster mode cluster as the current instance cluster.
    cy.wrap('local-cluster').as('clusterName')
  })

  beforeEach(function () {
    // Generate new resource state for the test environment.
    generateNewMultiResourceState(resources)

    // Log into the cluster ACM console.
    cy.visitAndLogin('/multicloud/home/search')
  })

  after(function () {
    // Attempt to cleanup resources that were created during the test run execution.
    cliHelper.deleteResource(resources[0], {
      failOnNonZeroExit: false,
    })
  })

  context(
    'Verify: search detail pages for yaml and logs',
    { tags: tags.modes },
    function () {
      beforeEach(function () {
        searchPage.shouldFindNamespaceInCluster(
          resources[1].namespace,
          this.clusterName
        )
      })

      it(`[P2][Sev2][${squad}] should see pod logs`, function () {
        searchBar.whenFilterByKind('pod')
        searchPage.whenGoToResourceDetailItemPage(
          'pod',
          'auto-test-deploy',
          resources[1].namespace
        )
        podDetailPage.whenClickOnLogsTab()
        podDetailPage.shouldSeeLogs('serving on')
      })

      // TODO: Re-enable within a smaller PR.
      // it(`[P3][Sev3][${squad}] should edit yaml and scale deployment`, function () {
      //   searchBar.whenFilterByKind('deployment')
      //   searchPage.whenGoToResourceDetailItemPage(
      //     resources[1].kind,
      //     resources[1].name,
      //     resources[1].namespace
      //   )
      //   deploymentDetailPage.whenScaleReplicasTo(2)
      // })

      // it(`[P3][Sev3][${squad}] should verify that the deployment scaled`, function () {
      //   searchBar.whenFilterByKind('deployment')
      //   searchPage.shouldFindResourceDetailItem(
      //     resources[1].kind,
      //     resources[1].name,
      //     resources[1].namespace
      //   )
      //   searchPage.whenExpandRelationshipTiles()
      //   searchPage.shouldFindRelationshipTile('pod', 2)
      // })
    }
  )
})
