/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

export const popupModal = {
  whenAccept:() => {
    popupModal.shouldExist()
    cy.get('.bx--btn--danger--primary', { timeout: 10000}).click()

    // WORKAROUND: Sometimes I get errors when indeed the action worked... Reported: https://github.com/open-cluster-management/backlog/issues/5735
    // cy.get('.bx--inline-notification', { timeout: 20000 }).should('not.exist')
    // popupModal.shouldNotExist()
  },
  shouldNotExist:() => cy.get('.bx--btn--danger--primary', { timeout: 60000 }).should('not.exist'),
  shouldExist:() => cy.get('.bx--btn--danger--primary', { timeout: 60000 }).should('exist')
}
