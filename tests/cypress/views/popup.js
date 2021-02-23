/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { setState } from "../support/commands"

export const popupModal = {
  whenAccept:() => {
    popupModal.shouldExist()
    cy.get('button.pf-m-danger', { timeout: 30000 }).click({ timeout: 15000 }).wait(500)
    cy.get('.pf-c-alert pf-m-inline pf-m-danger', { timeout: 10000 }).should('not.exist')
    popupModal.shouldNotExist().then(() => setState('didResourceDelete', true))
  },
  shouldNotExist:() => cy.get('button.pf-m-danger', { timeout: 30000 }).should('not.exist'),
  shouldExist:() => cy.get('button.pf-m-danger', { timeout: 30000 }).should('exist')
}
