/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../../config'
import { deploymentDetailPage } from '../../views/deploymentDetailPage'
import { searchPage, searchBar } from '../../views/search'
import { clusterModes, getNamespace } from '../../scripts/cliHelper'


clusterModes.forEach((clusterMode) => {
  if (clusterMode.skip) {
    return;
  }

  describe(`Search: ${clusterMode.label} Cluster - Scale Resource`, function() {
    before(function() {
      cy.login() // Every individual file requires for us to login during the test execution.
      clusterMode.valueFn().as('clusterName')
    })

    beforeEach(function() {
      searchPage.whenGoToSearchPage()
      searchBar.whenFilterByClusterAndNamespace(this.clusterName, getNamespace(clusterMode.label))
    })

    it(`[P2][Sev2][${squad}] should delete pod`, function() {
      searchBar.whenFilterByKind('pod')
      searchPage.whenDeleteResourceDetailItem('pod', getNamespace(clusterMode.label) + '-deployment')
      searchPage.shouldBeResourceDetailItemCreatedFewSecondsAgo('pod', getNamespace(clusterMode.label) + '-deployment')
    });

    it(`[P3][Sev3][${squad}] should scale deployment`, function() {
      searchBar.whenFilterByKind('deployment')
      searchPage.whenGoToResourceDetailItemPage('deployment', getNamespace(clusterMode.label) + '-deployment')
      deploymentDetailPage.whenScaleReplicasTo(2)
      cy.waitUsingSLA() // WORKAROUND to wait for resource to get indexed. Better solution is to retry instead of a hard wait.
    })

    it(`[P3][Sev3][${squad}] should verify that the deployment scaled`, function() {
      searchBar.whenFilterByKind('deployment')
      searchBar.whenFilterByName(getNamespace(clusterMode.label) + '-deployment')
      searchPage.shouldFindRelationshipTile('pod', '2')
    })
  })
});
