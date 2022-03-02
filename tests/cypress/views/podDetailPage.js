/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

export const podDetailPage = {
  whenClickOnLogsTab: () => {
    cy.wait(3000) // Adding a small delay to allow tab switch to occur.
    cy.get('.pf-c-nav__link')
      .filter(':contains("Logs")')
      .click({ timeout: 10000 })
  },
  shouldSeeLogs: (expected) => {
    cy.get('.pf-c-form__group-control .pf-c-select').click()
    cy.get('ul.pf-c-select__menu').click()
    cy.get('.pf-c-log-viewer__text').should('contain', expected)
  },
}
