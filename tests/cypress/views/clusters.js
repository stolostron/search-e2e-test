/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />


export const clustersPage = {
  shouldExist: () => {
    cy.get('.pf-c-title').should('contain', 'Cluster management')
  }
}
