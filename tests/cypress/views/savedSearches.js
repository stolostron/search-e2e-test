/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { searchPage, searchBar } from './search'

export const savedSearches = {
  editSavedSearch: (queryName, editedName, editedDesc) => {
    savedSearches.shouldExist(queryName)
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
  getSavedSearch: (queryName) => {
    savedSearches.shouldExist(queryName)
    cy.get('button.pf-c-dropdown__toggle')
      .contains('Saved searches')
      .click({ force: true })
    cy.get('ul.pf-c-dropdown__menu.pf-m-align-right')
      .contains(queryName)
      .click()
  },
  saveClusterNamespaceSearch: (cluster, namespace, queryName, queryDesc) => {
    searchPage.shouldFindNamespaceInCluster(namespace, cluster)
    cy.get('.pf-c-button.pf-m-primary').contains('Save search').focus().click()
    cy.get('#add-query-name').type(queryName)
    cy.get('#add-query-desc').type(queryDesc)
    cy.get('.pf-c-modal-box__footer').contains('Save').focus().click()
  },
  shareSavedSearch: (queryName) => {
    savedSearches.shouldExist(queryName)
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
  shouldExist: (queryName) => {
    cy.get('h4.pf-c-title.pf-m-md')
      .should('contain', 'Saved searches')
      .should('exist')
    cy.get('.pf-c-card__title').contains(queryName).should('exist')
  },
  shouldNotExist: (queryName) => {
    cy.get('.pf-c-card__title').contains(queryName).should('not.exist')
  },
  validateClusterNamespace: (filterOptions) => {
    searchPage.shouldValidateManagedCluster()
    cy.get('.pf-c-expandable-section__toggle').then(($btn) => {
      var fullText = $btn.text()
      var pattern = /[0-9]+/g
      var ManagedClustersCount = fullText.match(pattern)
      var expectedSearchClusterCount = Number(ManagedClustersCount)

      searchPage.whenGoToSearchPage()
      for (var key in filterOptions) {
        searchBar.whenEnterTextInSearchBar(key, filterOptions[key])
      }

      cy.get('.pf-c-skeleton').should('not.exist')
      cy.get('.pf-c-tile')
        .should('exist')
        .filter(':contains(Related cluster)')
        .and('contain', expectedSearchClusterCount)
    })
  },
  whenDeleteSavedSearch: (queryName) => {
    savedSearches.shouldExist(queryName)
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
