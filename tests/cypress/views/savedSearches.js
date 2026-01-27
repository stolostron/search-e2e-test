/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

import { pf } from '../support/selectors'
import { searchBar, searchPage } from './search'

export const savedSearches = {
  editSavedSearch: (queryName, editedName, editedDesc) => {
    savedSearches.shouldExist(queryName)
    cy.get(pf.card.header).contains(queryName).parent().parent().parent().find('button').focus().click()
    cy.get(`ul${pf.menu.list}`).contains('Edit').click()
    cy.get('#add-query-name').clear().type(editedName)
    cy.get('#add-query-desc').clear().type(editedDesc)
    cy.get(`${pf.button.primary}`).contains('Save').focus().click()
    savedSearches.shouldExist(editedName)
  },
  getSavedSearch: (queryName) => {
    savedSearches.shouldExist(queryName)
    cy.get(pf.menuToggle.button).contains('Saved searches').click({ force: true })
    cy.get(`ul${pf.menu.list}`).contains(queryName).click()
  },
  saveClusterNamespaceSearch: (cluster, namespace, queryName, queryDesc) => {
    searchPage.shouldFindNamespaceInCluster(namespace, cluster)
    searchBar.whenRunSearchQuery()
    cy.get(`${pf.button.plain}`).contains('Save search').focus().click()
    cy.get(pf.modal.header).should('exist')
    cy.get('#add-query-name').type(queryName)
    cy.get('#add-query-desc').type(queryDesc)
    cy.get(`${pf.button.primary}`).contains('Save').focus().click()
    // go back to search home page and check if search exists
    cy.get('[aria-label="Clear button for chips and input"]').focus().click()
    savedSearches.shouldExist(queryName)
  },
  shareSavedSearch: (queryName) => {
    savedSearches.shouldExist(queryName)
    cy.get(pf.card.header).contains(queryName).parent().parent().parent().find('button').focus().click()
    cy.get(`ul${pf.menu.list}`).contains('Share').click()
    cy.get('input')
      .invoke('val')
      .then((inputText) => inputText.includes('/multicloud/search?filters={"textsearch"'))
  },
  shouldExist: (queryName) => {
    cy.get(pf.title.h4Md).should('contain', 'Saved searches').should('exist')
    cy.get(pf.card.title).contains(queryName).should('exist')
  },
  whenDeleteSavedSearch: (queryName) => {
    savedSearches.shouldExist(queryName)
    cy.get(pf.card.header).contains(queryName).parent().parent().parent().find('button').focus().click()
    cy.get(`ul${pf.menu.list}`).contains('Delete').click()
    cy.get(`${pf.button.base}${pf.mod.danger}`).contains('Delete').click()
    cy.get(pf.card.title).contains(queryName).should('not.exist')
  },
}
