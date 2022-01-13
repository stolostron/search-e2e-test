/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

export const overviewPage = {
  whenGoToOverviewPage: () => cy.visit('/multicloud/home/overview'),
  whenGotoSearchPage: () => {
    cy.get(`[aria-label="search-button"]`).click()
  },
  whenAddProviderConnectionAction: () => {
    cy.get('#add-provider-connection')
      .should('have.attr', 'href')
      .and('contain', 'credentials')
    cy.get('#add-provider-connection').click()
  },
  shouldLoad: () => {
    cy.get('.pf-c-page').should('contain', 'Overview')
    cy.get('.pf-c-spinner').should('not.exist')
  },
  shouldLoadProviderConnectionPage: () => cy.get('.pf-c-page'), // Checking only for if the page loaded, since the page will either say cluster management or provider connection.
  shouldHaveClusterProviderCard: () => {
    cy.get('.pf-c-card__body.pf-c-skeleton').should('not.exist')
    cy.get('.pf-l-gallery.pf-m-gutter').find('.pf-c-card.pf-m-selectable')
    cy.get('.pf-c-card__footer').should('contain', 'Cluster')
  },
  shouldHaveClusterSummary: () => {
    cy.get('.pf-c-card__body.pf-c-skeleton').should('not.exist')
    cy.get('article.pf-c-card').should('contain', 'Summary')
    cy.get('.pf-c-card__body')
      .should('contain', 'Application')
      .and('contain', 'Cluster')
      .and('contain', 'Pods')
  },
  shouldHaveRefreshDropdown: () => {
    cy.get('p')
      .should('contain', 'Last update:')
      .and('not.contain', 'Invalid date')

    const intervals = ['30s', '1m', '5m', '30m', 'disable']

    intervals.forEach((opt) => {
      cy.get('#refresh-dropdown').click()
      cy.get(`#refresh-${opt}`).click()
    })
  },
  shouldHaveLinkToSearchPage: () => {
    cy.get('#clusters-summary a')
      .contains(/[0-9]+/)
      .then((c) => {
        let cluster = c.text()
        cy.wrap(c)
          .click()
          .then((p) => {
            cy.wrap(p)
              .get('.react-tags__selected')
              .should('have.length', 1)
              .invoke('text')
              .should('eq', 'kind:cluster')
            if (cluster !== '0') {
              cy.wrap(p)
                .get('.pf-c-expandable-section__toggle-text')
                .invoke('text')
                .should('contain', 'Cluster')
            }
          })
      })
    cy.go('back')
    cy.get('#pods-summary a').then((a) => {
      let pod = a.text()
      cy.wrap(a)
        .click()
        .then((p) => {
          cy.wrap(p)
            .get('.react-tags__selected')
            .should('have.length', 1)
            .invoke('text')
            .should('eq', 'kind:pod')
          if (pod !== '0') {
            cy.wrap(p)
              .get('.pf-c-expandable-section__toggle-text')
              .invoke('text')
              .should('contain', 'Pod')
          }
        })
    })
  },
  shouldHaveLeftNavLinkToTargetedPage: (page, noClick, path) => {
    overviewPage.shouldLoad()
    cy.get('.pf-c-nav__list').contains(page)

    if (noClick) {
      cy.get('li.pf-c-nav__item')
        .contains(page)
        .should('have.attr', 'href')
        .and('contain', path)
    } else {
      cy.get('li.pf-c-nav__item').contains(page).click()
      cy.get('h1.pf-c-title').contains(page)
    }
  },
}
