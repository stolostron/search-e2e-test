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
  }
}