/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

import { searchBar, searchPage } from './search'

export const savedSearches = {
  editSavedSearch: (queryName, editedName, editedDesc) => {
    savedSearches.shouldExist(queryName)
    cy.get('.pf-v5-c-card__header').contains(queryName).parent().parent().parent().find('button').focus().click()
    cy.get('.pf-v5-c-dropdown__menu.pf-m-align-right').contains('Edit').click()
    cy.get('#add-query-name').clear().type(editedName)
    cy.get('#add-query-desc').clear().type(editedDesc)
    cy.get('.pf-v5-c-button.pf-m-primary').contains('Save').focus().click()
    savedSearches.shouldExist(editedName)
  },
  getSavedSearch: (queryName) => {
    savedSearches.shouldExist(queryName)
    cy.get('button.pf-v5-c-dropdown__toggle').contains('Saved searches').click({ force: true })
    cy.get('ul.pf-v5-c-dropdown__menu.pf-m-align-right').contains(queryName).click()
  },
  saveClusterNamespaceSearch: (cluster, namespace, queryName, queryDesc) => {
    searchPage.shouldFindNamespaceInCluster(namespace, cluster)
    searchBar.whenRunSearchQuery()
    cy.get('button.pf-v5-c-button.pf-m-plain').contains('Save search').focus().click()
    cy.get('.pf-v5-c-modal-box__header').should('exist')
    cy.get('#add-query-name').type(queryName)
    cy.get('#add-query-desc').type(queryDesc)
    cy.get('.pf-v5-c-button.pf-m-primary').contains('Save').focus().click()
    // go back to search home page and check if search exists
    cy.get('[aria-label="Clear button for chips and input"]').focus().click()
    savedSearches.shouldExist(queryName)
  },
  shareSavedSearch: (queryName) => {
    savedSearches.shouldExist(queryName)
    cy.get('.pf-v5-c-card__header').contains(queryName).parent().parent().parent().find('button').focus().click()
    cy.get('.pf-v5-c-dropdown__menu.pf-m-align-right').contains('Share').click()
    cy.get('input')
      .invoke('val')
      .then((inputText) => inputText.includes('/multicloud/search?filters={"textsearch"'))
  },
  shouldExist: (queryName) => {
    cy.get('h4.pf-v5-c-title.pf-m-md').should('contain', 'Saved searches').should('exist')
    cy.get('.pf-v5-c-card__title').contains(queryName).should('exist')
  },
  whenDeleteSavedSearch: (queryName) => {
    savedSearches.shouldExist(queryName)
    cy.get('.pf-v5-c-card__header').contains(queryName).parent().parent().parent().find('button').focus().click()
    cy.get('.pf-v5-c-dropdown__menu.pf-m-align-right').contains('Delete').click()
    cy.get('.pf-v5-c-button.pf-m-danger').contains('Delete').click()
    cy.get('.pf-v5-c-card__title').contains(queryName).should('not.exist')
  },
}
