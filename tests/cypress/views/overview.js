/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { searchPage } from '../views/search'

/**
 * Overview page object for the ACM console.
 */
export const overviewPage = {
  /**
   * Verify that the Overview page should be loaded correctly.
   */
  shouldLoad: () => {
    cy.get('.pf-c-empty-state__icon').should('not.exist')
    cy.get('.pf-c-skeleton').should('not.exist')
    cy.get('h1.pf-c-title').filter(':contains(Overview)').should('exist')
  },
  /**
   * Verify that the Overview page should have a cluster provider card panel.
   */
  shouldHaveClusterProviderCard: () => {
    cy.get('.pf-l-gallery.pf-m-gutter').find('.pf-c-card.pf-m-selectable').should('exist')
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
        cy.get('.pf-c-card__body').should('contain', 'Application').and('contain', 'Cluster').and('contain', 'Nodes')
      })
  },
  /**
   * Verify that the Overview page should have accessible links to the Search page.
   */
  shouldHaveLinkToSearchPage: () => {
    cy.get('#clusters-summary a')
      .should('exist')
      .and('be.visible')
      .then((clusters) => {
        const numOfCluster = clusters.text()

        if (numOfCluster > 0) {
          cy.wrap(clusters).click()
        } else {
          cy.log(`${numOfCluster} detected within the overview cluster summary`)
        }
      })

    cy.get('.pf-c-chip-group__list').should('have.length', 1).invoke('text').should('eq', 'kind:cluster')

    searchPage.shouldLoadResults()
    cy.get('.pf-c-expandable-section__toggle-text').filter(':contains(Cluster)')
    cy.go('back')

    cy.get('#nodes-summary a').should('exist').and('be.visible').click()

    searchPage.shouldLoadResults()
    cy.get('.pf-c-expandable-section__toggle-text').filter(':contains(Node)')
  },
  /**
   * Navigate the test user to the Overview page within the ACM console.
   */
  whenGoToOverviewPage: () => {
    cy.visit('/multicloud/home/overview')
    overviewPage.shouldLoad()
  },
}
