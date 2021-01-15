/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { searchPage, searchBar } from './search'

export const savedSearches = {
  validateClusterNamespace: (filterOptions, extraCluster) => {

    //get managed clusters count
    searchPage.whenGoToSearchPage()
    searchBar.whenFocusSearchBar()
    searchBar.whenEnterTextInSearchBar('kind', 'cluster')
    searchBar.whenEnterTextInSearchBar('ManagedClusterJoined', 'True')

    cy.get('.pf-c-expandable-section__toggle', {timeout:6000})
      .then($btn =>{
        var fullText = $btn.text()
        var pattern = /[0-9]+/g
        var ManagedClustersCount = fullText.match(pattern)
	var expectedSearchClusterCount = Number(ManagedClustersCount)

	// local-cluster is default show in some filter conditions
	if (extraCluster == 'has_local-cluster'){
	  expectedSearchClusterCount = expectedSearchClusterCount + 1
	}

	searchPage.whenGoToSearchPage()
        for (var key in filterOptions){
          searchBar.whenEnterTextInSearchBar(key, filterOptions[key])
	}
	cy.contains(expectedSearchClusterCount)
	cy.contains('Related cluster')
      })
  },

  saveClusterNamespaceSearch: (filterOptions, queryName, queryDesc) => {
    searchPage.whenGoToSearchPage()
    for (var key in filterOptions){
      searchBar.whenEnterTextInSearchBar(key, filterOptions[key])
    }
    cy.get('.pf-c-button.pf-m-primary',{timeout: 20000}).contains('Save search').should('exist').focus().click()
    cy.get('#add-query-name', {timeout: 20000}).type(queryName)
    cy.get('#add-query-desc', {timeout: 20000}).type(queryDesc)
    cy.get('.pf-c-modal-box__footer', {timeout: 20000}).contains('Save').should('exist').focus().click()
  },

  getSavedSearch: (queryName) => {
    searchPage.whenGoToSearchPage()
    cy.get('.pf-c-title.pf-m-md', {timeout: 20000}).contains('Saved searches').should('exist')
    cy.get('button.pf-c-dropdown__toggle.pf-m-plain', {timeout: 20000}).contains('Saved searches').should('exist').click({force: true})
    cy.get('ul.pf-c-dropdown__menu.pf-m-align-right', {timeout: 20000}).contains(queryName).click()
  },

  whenDeleteSavedSearch: (queryName) => {
    searchPage.whenGoToSearchPage()
    cy.get('.pf-c-title.pf-m-md', {timeout: 20000}).contains('Saved searches').should('exist')
    cy.get('.pf-c-card__header', {timeout: 20000}).contains(queryName).should('exist').parent().siblings().find('button').click()
    cy.get('.pf-c-dropdown__menu.pf-m-align-right').contains('Delete').click()
    cy.get('.pf-c-button.pf-m-danger').contains('Delete').click().reload()
    cy.get('.pf-c-card__title').contains(queryName).should('not.exist')
  },
}
