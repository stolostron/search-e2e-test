/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../../config'
import { cliHelper, clusterModes } from '../../scripts/cliHelper'
import { deploymentDetailPage } from '../../views/deploymentDetailPage'
import { searchPage, searchBar } from '../../views/search'

clusterModes.forEach((clusterMode) => {
  if (clusterMode.skip) {
    return;
  }

  describe('Search: Search in ' + clusterMode.label + ' Cluster', function() {
    before(function() {
      clusterMode.valueFn().as('clusterName')
      cy.generateNamespace().as('namespace')

      if (clusterMode.label === 'Managed') {
        cliHelper.loginToCluster(clusterMode.label)
      }
    })

    beforeEach(function() {
      searchPage.whenGoToSearchPage()
    })

    after(function() {
      cliHelper.deleteNamespace(this.namespace)
    })

    describe('search resources', function() {
      it(`[P2][Sev2][${squad}] should delete pod`, function() {
        cliHelper.createNamespaceAndDeployment(this.namespace)
        searchBar.whenFilterByNamespace(this.namespace)
        searchBar.whenFilterByKind('pod')
        searchPage.whenDeleteResourceDetailItem('pod', this.namespace + '-deployment')
        searchPage.shouldBeResourceDetailItemCreatedFewSecondsAgo('pod', this.namespace + '-deployment')
      });

      it(`[P3][Sev3][${squad}] should scale deployment`, function() {
        searchBar.whenFilterByNamespace(this.namespace)
        searchBar.whenFilterByKind('deployment')
        searchPage.whenGoToResourceDetailItemPage('deployment', this.namespace + '-deployment')
        deploymentDetailPage.whenScaleReplicasTo(2)
      })

      it(`[P3][Sev3][${squad}] should verify that the deployment scaled`, function() {
        searchBar.whenFilterByNamespace(this.namespace)
        searchBar.whenFilterByKind('deployment')
        searchBar.whenFilterByName(this.namespace + '-deployment')
        searchPage.shouldFindRelationshipTile('pod', '2')
      })
    })
  })
});
