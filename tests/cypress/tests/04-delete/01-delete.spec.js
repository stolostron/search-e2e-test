/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../../config'
import { searchPage, searchBar } from '../../views/search'
import { clusterModes, getNamespace } from '../../scripts/cliHelper'

clusterModes.forEach((clusterMode) => {
  if (clusterMode.skip) {
    return;
  }

  describe(`Search: ${clusterMode.label} Cluster - Delete Resource`, function() {
    before(function() {
      cy.login() // Every individual file requires for us to login during the test execution.
      clusterMode.valueFn().as('clusterName')
    })

    beforeEach(function() {
      searchPage.whenGoToSearchPage()
    })

    it(`[P2][Sev2][${squad}] should delete deployment`, function() {
      searchBar.whenFilterByNameSpace(getNamespace(clusterMode.label))
      searchBar.whenFilterByKind('deployment')
      searchPage.whenDeleteResourceDetailItem('deployment', getNamespace(clusterMode.label) + '-deployment')
    });

    it(`[P2][Sev2][${squad}] should validate deployment was deleted`, function() {
      searchBar.whenFilterByNameSpace(getNamespace(clusterMode.label))
      searchBar.whenFilterByKind('deployment')
      searchBar.whenFilterByName(getNamespace(clusterMode.label) + '-deployment', true)
      searchPage.shouldFindNoResults()
    });

    it(`[P2][Sev2][${squad}] should delete namespace`, function() {
      searchBar.whenFilterByKind('namespace')
      searchBar.whenFilterByName(getNamespace(clusterMode.label))
      searchPage.whenDeleteNamespace(getNamespace(clusterMode.label))
      cy.wait(5000)
    });

    it(`[P2][Sev2][${squad}] should validate namespace was deleted`, function() {
      searchBar.whenFilterByNameSpace(getNamespace(clusterMode.label), true)
      searchPage.shouldFindNoResults()
    });
  })
})
