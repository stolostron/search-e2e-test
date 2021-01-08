/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />


export const overviewPage = {
    whenGoToOverviewPage:() => cy.visit('/overview'),
    shouldExist: () => {
        cy.get('.pf-c-page').should('contain', 'Overview')
    },
}

