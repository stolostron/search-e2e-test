/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

export const pageLoader = {
  shouldExist: () => cy.get('.content-spinner', { timeout: 20000 }).should('exist')  ,
  shouldNotExist: () => cy.get('.content-spinner', { timeout: 20000 }).should('not.exist')
}

export const searchPage = {
  shouldExist:() => {
    cy.get('.bx--detail-page-header-title', {timeout:20000}).should('exist'),
    cy.get('.react-tags__search-input input', {timeout:20000}).should('exist')
    cy.get('.saved-search-query-header', { timeout:20000}).should('exist')
  }
}

export const searchBar = {
  focusSearchBar:() => {
    cy.get('.react-tags', {timeout:20000}).click()
    cy.get('.react-tags__suggestions').should('exist')
  },
  enterTextInSearchBar:(property, op, value) => {
    cy.get('.react-tags__search-input input').type(property),
    cy.get('.react-tags').should('exist'),
    cy.get('.react-tags__search-input input').should('exist').click(),
    cy.get('.react-tags__suggestions').should('exist'),
    cy.get('.react-tags__search-input').should('exist')
    cy.get('.react-tags__search-input input').type(' ')
    if (op !== null && value !== null) {
      const valueText = op + value
      cy.get('.react-tags__search-input input').type(valueText)
      cy.get('.react-tags__search-input input').type(' ')
    }
  },
  checkTagArray:(query) => {
    cy.get('.react-tags__selected-tag-name').contains(query)
  },
  checkSpecificSearchFilter:(idx, query) => {
    cy.get('').eq(idx).contains(query)
  },
  verifySearchResult:(idx, query) => {
    cy.get('.bx--data-table-v2').should('exist')
    cy.get('.bx--data-table-v2 tr').eq(idx).contains( query)
  }
}
