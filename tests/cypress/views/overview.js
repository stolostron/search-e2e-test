/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

/**
 * Overview page object for the ACM console.
 */
export const overviewPage = {
  /**
   * Verify that the overview page should contain no skeleton placeholder elements.
   */
  shouldFindNoSkeleton: () => {
    cy.get('.pf-c-empty-state__icon').should('not.exist')
    cy.get('.pf-c-skeleton').should('not.exist')
  },
  /**
   * Verify that the Overview page should have a cluster provider card panel.
   */
  shouldHaveClusterProviderCard: () => {
    cy.get('.pf-l-gallery.pf-m-gutter')
      .find('.pf-c-card.pf-m-selectable')
      .should('exist')
    cy.get('.pf-c-card__footer').should('exist').and('contain', 'Cluster')
  },
  /**
   * Verify that the Overview page should have a summary of the test cluster environment.
   */
  shouldHaveClusterSummary: () => {
    cy.get('article.pf-c-card')
      .filter(':contains(Summary)')
      .should('exist')
      .within(() => {
        cy.get('.pf-c-card__body')
          .should('contain', 'Application')
          .and('contain', 'Cluster')
          .and('contain', 'Pods')
      })
  },
  /**
   * Verify that the Overview page should have different refresh limit for the test cluster environment.
   */
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
  /**
   * Verify that the Overview page should have accessible links to the Search page.
   */
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
  /**
   * Verify that the Overview page should have a left navigation panel that contain accessible links to a specified page.
   * @param {string} page The page to check for within the left navigation panel.
   * @param {bool} noClick Determine if the link should be clicked on within the test.
   * @param {string} path The URL path of the targeted page.
   */
  shouldHaveLeftNavLinkToTargetedPage: (page, noClick, path) => {
    cy.get('.pf-c-nav__list').contains(page)

    if (noClick) {
      cy.get('li.pf-c-nav__item')
        .contains(page)
        .should('have.attr', 'href')
        .and('contain', path)
    } else {
      cy.get('li.pf-c-nav__item').contains(page).click()

      if (page === 'Welcome') {
        overviewPage.shouldLoadPageHeader()
        cy.get('.welcome--introduction').should('contain', 'Welcome')
      } else {
        overviewPage.shouldLoadPageHeader()
        cy.get('h1.pf-c-title').contains(page)
      }
    }
  },
  /**
   * Verify that the Overview page should be loaded correctly.
   */
  shouldLoad: () => {
    overviewPage.shouldLoadPageHeader()
    overviewPage.shouldFindNoSkeleton()
    cy.get('.pf-c-title').filter(':contains(Overview)').should('exist')
  },
  /**
   * Verify that the Add credential page should be loaded correctly.
   */
  shouldLoadAddCredentialPage: () => {
    overviewPage.shouldLoadPageHeader()
    cy.get('.pf-c-empty-state__icon').should('not.exist')
    cy.get('.pf-c-title').filter(':contains(credential)').should('exist')
  },
  /**
   * Verify that the page header should be loaded correctly.
   */
  shouldLoadPageHeader: () => {
    cy.get('.pf-c-page__header').should('be.visible')
  },
  /**
   * Navigate the test user to the Add provider connection page within the ACM console.
   */
  whenAddProviderConnectionAction: () => {
    cy.get('#add-provider-connection')
      .should('have.attr', 'href')
      .and('contain', 'credentials')
    cy.get('#add-provider-connection').click()
  },
  /**
   * Navigate the test user to the Overview page within the ACM console.
   */
  whenGoToOverviewPage: () => {
    cy.visit('/overview')
    overviewPage.shouldLoad()
  },
}
