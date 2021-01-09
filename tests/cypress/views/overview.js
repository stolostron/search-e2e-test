/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />


export const overviewPage = {
    whenGoToOverviewPage:() => cy.visit('/overview'),
    whenAddCloudConnectionAction: () => {
        cy.get('#add-cloud-connection').should('exist')
        cy.get('#add-cloud-connection').click()
    },
    shouldLoad: () => {
        cy.get('.pf-c-page').should('contain', 'Overview')
        cy.get('.pf-c-spinner', { timeout: 20000 }).should('not.exist')
    },
    shouldLoadCloudConnectionPage: () => {
        cy.get('.pf-c-page').should('contain', 'Create cluster')
    },
}

