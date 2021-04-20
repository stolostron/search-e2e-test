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

  describe(`Search: ${clusterMode.label} - Search For Resource`, function() {
    before(function() {
      cy.login() // Every individual file requires for us to login during the test execution.
      clusterMode.valueFn().as('clusterName')
    })

    beforeEach(function() {
      searchPage.whenGoToSearchPage()
    })

    it(`[P2][Sev2][${squad}] should verify that resources exist`, function() {
      searchBar.whenFilterByNameSpace(getNamespace(clusterMode.label))
      searchBar.whenFilterByCluster(this.clusterName)
      searchPage.shouldCollapseResourceTables()
    })
  })
});
