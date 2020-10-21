/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

export const podDetailPage = {
  whenClickOnLogsTab:() => {
    cy.get('#logs-tab', { timeout: 10000 }).click({ timeout: 10000 })
  },
  shouldSeeLogs:(expected) => {
    cy.contains('.logs-container__content', expected, { timeout: 5000 })
  }
}
