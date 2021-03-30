/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

export const overviewPage = {
  whenGoToOverviewPage: () => cy.visit('/overview'),
  whenAddProviderConnectionAction: () => cy.wait(500).get('#add-provider-connection').click(),
  shouldLoad: () => {
    cy.get('.pf-c-page').should('contain', 'Overview')
    cy.get('.pf-c-spinner').should('not.exist')
  },
  shouldLoadProviderConnectionPage: () => cy.get('.pf-c-page').should('contain', 'provider connection'),
  shouldHaveLinkToSearchPage: () => {
    cy.get('#clusters-summary a').contains(/[0-9]+/).then((c) => {
      let cluster = c.text()
      cy.wrap(c).click().then((p) => {
        cy.wrap(p).get('.react-tags__selected').should('have.length', 1).invoke('text').should('eq', 'kind:cluster')
        cy.wrap(p).get('.pf-c-expandable-section__toggle-text').invoke('text').should('equal', 'Cluster ('+cluster+')')
      })
    })
    cy.go('back')
    cy.get('#pods-summary a').then((a) => {
      let pod = a.text()
      cy.wrap(a).click().then((p) => {
        cy.wrap(p).get('.react-tags__selected').should('have.length', 1).invoke('text').should('eq', 'kind:pod')
        cy.wrap(p).get('.pf-c-expandable-section__toggle-text').invoke('text').should('equal', 'Pod ('+pod+')')
      })
    })
  },
}

