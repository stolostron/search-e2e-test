/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { searchPage, searchBar } from '../views/search'

export const clusterNamespace = {
  validateClusterNamespace: (filterOptions, extraCluster) => {

    //get managed clusters count
    searchPage.whenGoToSearchPage()
    searchBar.whenFocusSearchBar()
    searchBar.whenEnterTextInSearchBar('kind', 'cluster')
    searchBar.whenEnterTextInSearchBar('ManagedClusterJoined', 'True')

    cy.get(".search--resource-table-header-button", {timeout:6000})
      .then($btn =>{
        var fullText = $btn.text()
        var pattern = /[0-9]+/g
        var ManagedClustersCount = fullText.match(pattern)
	var expectedSearchClusterCount = Number(ManagedClustersCount)

	// local-cluster is default show in some filter conditions
	if (extraCluster == "has_local-cluster"){
	  expectedSearchClusterCount = expectedSearchClusterCount + 1
	}

	searchPage.whenGoToSearchPage()
        for (var key in filterOptions){
          searchBar.whenEnterTextInSearchBar(key, filterOptions[key])
	}
	cy.contains(expectedSearchClusterCount)
	cy.contains("Related cluster")
      })
  },

  saveClusterNamespaceSearch: (filterOptions, queryName, queryDesc) => {
    searchPage.whenGoToSearchPage()
    for (var key in filterOptions){
      searchBar.whenEnterTextInSearchBar(key, filterOptions[key])
    }
    cy.get(".search-input-save-button",{timeout: 20000}).should('exist').focus().click()
    cy.get("#add-query-name", {timeout: 20000}).type(queryName)
    cy.get("#add-query-desc", {timeout: 20000}).type(queryDesc)
    cy.get(".bx--btn--primary",{timeout: 20000}).should('exist').focus().click()
  },

  getSavedSearch: (queryName) => {
    searchPage.whenGoToSearchPage()
    cy.get(".bx--list-box__field",{timeout: 20000}).should('exist').click()
    cy.get('.bx--list-box__menu-item').contains(queryName).click()
  }
}