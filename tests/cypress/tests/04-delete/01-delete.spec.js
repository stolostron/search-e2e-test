/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../../config'
import { clusterModes, cliHelper } from '../../scripts/cliHelper'
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

    describe('search resources', function() {
      it(`[P2][Sev2][${squad}] should delete deployment`, function() {
        cliHelper.createNamespaceAndDeployment(this.namespace)
        searchBar.whenFilterByNamespace(this.namespace)
        searchBar.whenFilterByKind('deployment')
        searchPage.whenDeleteResourceDetailItem('deployment', this.namespace + '-deployment')
      });

      it(`[P2][Sev2][${squad}] should validate deployment was deleted`, function() {
        searchBar.whenFilterByNamespace(this.namespace)
        searchBar.whenFilterByKind('deployment', true)
        searchBar.whenFilterByName(this.namespace + '-deployment', true)
        searchPage.shouldFindNoResults()
      });

      it(`[P2][Sev2][${squad}] should delete namespace`, function() {
        searchPage.whenDeleteNamespace(this.namespace)
      });

      it(`[P2][Sev2][${squad}] should validate namespace was deleted`, function() {
        searchBar.whenFilterByKind('namespace')
        searchBar.whenFilterByName(this.namespace, true)
        searchPage.shouldFindNoResults()
      });
    })
  })
});
