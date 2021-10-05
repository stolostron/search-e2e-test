/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { searchPage, searchBar } from './search'

export const savedSearches = {
  whenGotoSearchPage: () => {
    cy.get(`[aria-label="search-button"]`).click()
  },

  validateClusterNamespace: (filterOptions, extraCluster) => {
    //get managed clusters count
    searchPage.whenGoToSearchPage()
    searchBar.whenFocusSearchBar()
    searchBar.whenEnterTextInSearchBar('kind', 'cluster')
    searchBar.whenEnterTextInSearchBar('ManagedClusterJoined', 'True')

    cy.get('.pf-c-expandable-section__toggle', { timeout: 6000 }).then(
      ($btn) => {
        var fullText = $btn.text()
        var pattern = /[0-9]+/g
        var ManagedClustersCount = fullText.match(pattern)
        var expectedSearchClusterCount = Number(ManagedClustersCount)

        // local-cluster is default show in some filter conditions
        if (extraCluster == 'has_local-cluster') {
          expectedSearchClusterCount = expectedSearchClusterCount + 1
        }

        searchPage.whenGoToSearchPage()
        for (var key in filterOptions) {
          searchBar.whenEnterTextInSearchBar(key, filterOptions[key])
        }

        cy.contains(expectedSearchClusterCount)
        cy.contains('Related cluster')
      }
    )
  },

  saveClusterNamespaceSearch: (filterOptions, queryName, queryDesc) => {
    searchPage.whenGoToSearchPage()
    for (var key in filterOptions) {
      searchBar.whenEnterTextInSearchBar(key, filterOptions[key])
    }
    cy.get('.pf-c-button.pf-m-primary').contains('Save search').focus().click()
    cy.get('#add-query-name').type(queryName)
    cy.get('#add-query-desc').type(queryDesc)
    cy.get('.pf-c-modal-box__footer').contains('Save').focus().click()
  },

  editSavedSearch: (queryName, editedName, editedDesc) => {
    cy.get('h4.pf-c-title.pf-m-md').contains('Saved searches')
    cy.get('.pf-c-card__header')
      .contains(queryName)
      .parent()
      .siblings()
      .find('button')
      .click()
    cy.get('.pf-c-dropdown__menu.pf-m-align-right').contains('Edit').click()
    cy.get('#add-query-name').clear().type(editedName)
    cy.get('#add-query-desc').clear().type(editedDesc)
    cy.get('.pf-c-modal-box__footer').contains('Save').focus().click()
  },

  shareSavedSearch: (queryName) => {
    cy.get('h4.pf-c-title.pf-m-md').contains('Saved searches')
    cy.get('.pf-c-card__header')
      .contains(queryName)
      .parent()
      .siblings()
      .find('button')
      .click()
    cy.get('.pf-c-dropdown__menu.pf-m-align-right').contains('Share').click()
    cy.get('.pf-c-code-editor__code')
      .find('pre')
      .invoke('text')
      .then((urlText) => {
        cy.visit(urlText.toString())
      })
  },

  getSavedSearch: (queryName) => {
    cy.get('h4.pf-c-title.pf-m-md').contains('Saved searches')
    cy.get('button.pf-c-dropdown__toggle')
      .contains('Saved searches')
      .click({ force: true })
    cy.get('ul.pf-c-dropdown__menu.pf-m-align-right')
      .contains(queryName)
      .click()
    cy.go('back')
  },

  whenDeleteSavedSearch: (queryName) => {
    cy.get('h4.pf-c-title.pf-m-md').contains('Saved searches')
    cy.get('.pf-c-card__header')
      .contains(queryName)
      .parent()
      .siblings()
      .find('button')
      .click()
    cy.get('.pf-c-dropdown__menu.pf-m-align-right').contains('Delete').click()
    cy.get('.pf-c-button.pf-m-danger').contains('Delete').click().reload()
    cy.get('.pf-c-card__title').contains(queryName).should('not.exist')
  },
}
