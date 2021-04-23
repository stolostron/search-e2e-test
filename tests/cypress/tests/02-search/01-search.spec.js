/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../../config'
import { cliHelper, clusterModes } from '../../scripts/cliHelper'
import { podDetailPage } from '../../views/podDetailPage'
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
      it(`[P3][Sev3][${squad}] should have expected count of relationships`, function() {
        cliHelper.createNamespaceAndDeployment(this.namespace)
        searchBar.whenFilterByNamespace(this.namespace)
        searchPage.shouldLoadResults()
        searchPage.whenExpandRelationshipTiles()
        searchPage.shouldFindRelationshipTile('cluster', '1')
        searchPage.shouldFindRelationshipTile('deployment', '1')
        searchPage.shouldFindRelationshipTile('pod', '1')
      });

      it(`[P1][Sev1][${squad}] should work kind filter for deployment`, function() {
        searchBar.whenFilterByNamespace(this.namespace)
        searchBar.whenFilterByKind('deployment')
        searchPage.shouldFindResourceDetailItem('deployment', this.namespace + '-deployment')
      });

      it(`[P1][Sev1][${squad}] should work kind filter for pod`, function() {
        searchBar.whenFilterByNamespace(this.namespace)
        searchBar.whenFilterByKind('pod')
        searchPage.shouldFindResourceDetailItem('pod', this.namespace + '-deployment-')
      });

      it(`[P2][Sev2][${squad}] should see pod logs`, function() {
        searchBar.whenFilterByNamespace(this.namespace)
        searchBar.whenFilterByKind('pod')
        searchPage.whenGoToResourceDetailItemPage('pod', this.namespace + '-deployment-')
        podDetailPage.whenClickOnLogsTab()
      });
    })
  })
});
