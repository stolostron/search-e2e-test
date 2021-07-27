/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

export const overviewPage = {
  whenGoToOverviewPage: () => cy.visit('/overview'),
  whenGotoSearchPage: () => {
    cy.get(`[aria-label="search-button"]`).click()
  },
  whenAddProviderConnectionAction: () => {
    cy.get('#add-provider-connection').should('have.attr', 'href').and('contain', 'credentials')
    cy.get('#add-provider-connection').click()
  },
  shouldLoad: () => {
    cy.get('.pf-c-page').should('contain', 'Overview')
    cy.get('.pf-c-spinner').should('not.exist')
  },
  shouldLoadProviderConnectionPage: () => cy.get('.pf-c-page'), // Checking only for if the page loaded, since the page will either say cluster management or provider connection.
  shouldHaveLinkToSearchPage: () => {
    cy.get('#clusters-summary a').contains(/[0-9]+/).then((c) => {
      let cluster = c.text()
      cy.wrap(c).click().then((p) => {
        cy.wrap(p).get('.react-tags__selected').should('have.length', 1).invoke('text').should('eq', 'kind:cluster')
        if(cluster!=="0")
        {
          cy.wrap(p).get('.pf-c-expandable-section__toggle-text').invoke('text').should('contain', 'Cluster')
        }
      })
    })
    cy.go('back')
    cy.get('#pods-summary a').then((a) => {
      let pod = a.text()
      cy.wrap(a).click().then((p) => {
        cy.wrap(p).get('.react-tags__selected').should('have.length', 1).invoke('text').should('eq', 'kind:pod')
        if(pod!=="0")
        {
          cy.wrap(p).get('.pf-c-expandable-section__toggle-text').invoke('text').should('contain', 'Pod')
        }
      })
    })
  },
  shouldHaveLinkToTargetedPage: (page, noClick, path) => {
    overviewPage.shouldLoad()
    cy.get('.pf-c-nav__list').contains(page)

    if (noClick) {
      cy.get('li.pf-c-nav__item').contains(page).should('have.attr', 'href').and('contain', path)
    } else {
      cy.get('li.pf-c-nav__item').contains(page).click()

      if (page === 'Welcome') {
        cy.get('.welcome--introduction').should('contain', 'Welcome')
      } else {
        cy.get('h1.pf-c-title').contains(page)
      }
    }
  },
  shouldHaveLinkToResourceCreationPage: () => {
    cy.get(`[aria-label="create-button"]`).invoke('attr', 'href')
  }
}
