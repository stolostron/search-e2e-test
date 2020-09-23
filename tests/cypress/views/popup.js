/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

export const popupModal = {
  whenAccept:() => {
    popupModal.shouldExist()
    cy.get('.bx--btn--danger--primary', { timeout: 20000}).click({ force: true })
    cy.get('.bx--inline-notification', { timeout: 20000 }).should('not.exist')
    popupModal.shouldNotExist()
  },
  shouldNotExist:() => cy.get('.bx--btn--danger--primary', { timeout: 60000 }).should('not.exist'),
  shouldExist:() => cy.get('.bx--btn--danger--primary', { timeout: 60000 }).should('exist')
}
