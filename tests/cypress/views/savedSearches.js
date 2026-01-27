/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

import { pf } from '../support/selectors'
import { searchBar, searchPage } from './search'

export const savedSearches = {
  editSavedSearch: (queryName, editedName, editedDesc) => {
    savedSearches.shouldExist(queryName)
    cy.get(pf.layout.bullseye).should('not.exist')
    // Find the card containing the query name and click its kebab menu
    cy.get(pf.card.base).contains(queryName).closest(pf.card.base).find('button').click()
    cy.get(`ul${pf.menu.list}`).contains('Edit').click()
    cy.get(pf.modal.box).should('exist')
    cy.get('#add-query-name').clear().type(editedName)
    cy.get('#add-query-desc').clear().type(editedDesc)
    // Click Save button within the modal
    cy.get(pf.modal.box).within(() => {
      cy.contains('button', 'Save').click()
    })
    cy.get(pf.modal.box).should('not.exist')
    cy.get(pf.layout.bullseye).should('not.exist')
    savedSearches.shouldExist(editedName)
  },
  getSavedSearch: (queryName) => {
    savedSearches.shouldExist(queryName)
    cy.get(pf.layout.bullseye).should('not.exist')
    // Click on the saved search card to load that search
    cy.get(pf.card.base).contains(queryName).click()
  },
  saveClusterNamespaceSearch: (cluster, namespace, queryName, queryDesc) => {
    searchPage.shouldFindNamespaceInCluster(namespace, cluster)
    searchBar.whenRunSearchQuery()
    // Click "Save search" - could be button or link
    cy.contains('Save search').click()
    cy.get(pf.modal.box).should('exist')
    cy.get('#add-query-name').type(queryName)
    cy.get('#add-query-desc').type(queryDesc)
    // Click Save button within the modal
    cy.get(pf.modal.box).within(() => {
      cy.contains('button', 'Save').click()
    })
    // Wait for modal to close and loading overlay to disappear
    cy.get(pf.modal.box).should('not.exist')
    cy.get(pf.layout.bullseye).should('not.exist')
    // go back to search home page and check if search exists
    cy.get('[aria-label="Clear button for chips and input"]').click()
    savedSearches.shouldExist(queryName)
  },
  shareSavedSearch: (queryName) => {
    savedSearches.shouldExist(queryName)
    cy.get(pf.layout.bullseye).should('not.exist')
    // Find the card containing the query name and click its kebab menu
    cy.get(pf.card.base).contains(queryName).closest(pf.card.base).find('button').click()
    cy.get(`ul${pf.menu.list}`).contains('Share').click()
    cy.get('input')
      .invoke('val')
      .then((inputText) => inputText.includes('/multicloud/search?filters={"textsearch"'))
  },
  shouldExist: (queryName) => {
    cy.get(pf.layout.bullseye).should('not.exist')
    cy.contains('Saved searches').should('exist')
    cy.get(pf.card.title).contains(queryName).should('exist')
  },
  whenDeleteSavedSearch: (queryName) => {
    savedSearches.shouldExist(queryName)
    cy.get(pf.layout.bullseye).should('not.exist')
    // Find the card containing the query name and click its kebab menu
    cy.get(pf.card.base).contains(queryName).closest(pf.card.base).find('button').click()
    cy.get(`ul${pf.menu.list}`).contains('Delete').click()
    cy.contains('button', 'Delete').click()
    cy.get(pf.modal.box).should('not.exist')
    cy.get(pf.layout.bullseye).should('not.exist')
    cy.get(pf.card.title).contains(queryName).should('not.exist')
  },
}
