/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { searchBar, searchPage } from './search'

export const savedSearches = {
  editSavedSearch: (queryName, editedName, editedDesc) => {
    savedSearches.shouldExist(queryName)
    cy.get('.pf-c-card__header').contains(queryName).parent().siblings().find('button').click()
    cy.get('.pf-c-dropdown__menu.pf-m-align-right').contains('Edit').click()
    cy.get('#add-query-name').clear().type(editedName)
    cy.get('#add-query-desc').clear().type(editedDesc)
    cy.get('.pf-c-button.pf-m-primary').contains('Save').focus().click()
    savedSearches.shouldExist(editedName)
  },
  getSavedSearch: (queryName) => {
    savedSearches.shouldExist(queryName)
    cy.get('button.pf-c-dropdown__toggle').contains('Saved searches').click({ force: true })
    cy.get('ul.pf-c-dropdown__menu.pf-m-align-right').contains(queryName).click()
  },
  saveClusterNamespaceSearch: (cluster, namespace, queryName, queryDesc) => {
    searchPage.shouldFindNamespaceInCluster(namespace, cluster)
    searchBar.whenRunSearchQuery()
    cy.get('.pf-c-button.pf-m-plain').contains('Save search').focus().click()
    cy.get('#add-query-name').type(queryName)
    cy.get('#add-query-desc').type(queryDesc)
    cy.get('.pf-c-button.pf-m-primary').contains('Save').focus().click()
    // go back to search home page and check if search exists
    cy.get('[aria-label="Clear button for chips and input"]').focus().click()
    savedSearches.shouldExist(queryName)
  },
  shareSavedSearch: (queryName) => {
    savedSearches.shouldExist(queryName)
    cy.get('.pf-c-card__header').contains(queryName).parent().siblings().find('button').click()
    cy.get('.pf-c-dropdown__menu.pf-m-align-right').contains('Share').click()
    cy.get('#text-input-0').contains('/multicloud/home/search?filters={"textsearch"')
  },
  shouldExist: (queryName) => {
    cy.get('h4.pf-c-title.pf-m-md').should('contain', 'Saved searches').should('exist')
    cy.get('.pf-c-card__title').contains(queryName).should('exist')
  },
  whenDeleteSavedSearch: (queryName) => {
    savedSearches.shouldExist(queryName)
    cy.get('.pf-c-card__header').contains(queryName).parent().siblings().find('button').click()
    cy.get('.pf-c-dropdown__menu.pf-m-align-right').contains('Delete').click()
    cy.get('.pf-c-button.pf-m-danger').contains('Delete').click()
    cy.get('.pf-c-card__title').contains(queryName).should('not.exist')
  },
}
