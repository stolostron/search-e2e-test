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

    cy.get(".pf-c-expandable-section__toggle", {timeout:6000})
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
    cy.get("button.pf-c-button.pf-m-primary", {timeout: 20000}).contains('Save search').should('exist').focus().click()
    cy.get("#add-query-name", {timeout: 20000}).type(queryName)
    cy.get("#add-query-desc", {timeout: 20000}).type(queryDesc)
    cy.get("footer.pf-c-modal-box__footer", {timeout: 20000}).children(0).contains('Save').should('exist').focus().click()
  },

  getSavedSearch: (queryName) => {
    searchPage.whenGoToSearchPage()
    cy.get("h4.pf-c-title.pf-m-md", {timeout: 20000}).contains('Saved searches').should('exist')
    cy.get("button.pf-c-dropdown__toggle.pf-m-plain", {timeout: 20000}).should('exist').first().click()
    cy.get('ul.pf-c-dropdown__menu.pf-m-align-right', {timeout: 20000}).contains(queryName).should('exist').click()
    cy.get("button.pf-c-expandable-section__toggle", { timeout: 20000}).should('exist')
  }
}
