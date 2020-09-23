/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

export const podDetailPage = {
  whenClickOnLogsTag:() => {
    cy.get('#logs-tab').click()
  },
  shouldSeeLogs:(expected) => {
    cy.contains('.logs-container__content', expected, { timeout: 5000 })
  }
}
