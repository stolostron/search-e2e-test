/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

/**
 * Cluster page object for the ACM console.
 */
export const clustersPage = {
  /**
   * Verify that the cluster page should contain no skeleton placeholder elements.
   */
  shouldFindNoSkeleton: () => {
    cy.get('.pf-c-empty-state__icon').should('not.exist')
    cy.get('.pf-c-skeleton').should('not.exist')
  },
  /**
   * Verify that the cluster page should have accessible links to the Search page.
   */
  shouldHaveLinkToSearchPage: () => {
    cy.get('.pf-c-table tbody')
      .should('be.visible')
      .and('exist')
      .find('tr')
      .first()
      .then((c) => {
        let name = c.find('[data-label="Name"] a').text()
        cy.wrap(c)
          .find('.pf-c-dropdown__toggle')
          .click()
          .get('a')
          .contains('Search cluster')
          .click()
          .then(() =>
            cy
              .url()
              .should(
                'include',
                `/search?filters={%22textsearch%22:%22cluster%3A${name}%22}`
              )
          )
      })
  },
  /**
   * Verify that the cluster page should have loaded correctly.
   */
  shouldLoad: () => {
    clustersPage.shouldLoadPageHeader()
    clustersPage.shouldFindNoSkeleton()
    cy.get('.pf-c-title').filter(':contains(Clusters)').should('exist')
  },
  /**
   * Verify that the cluster page header should be loaded correctly.
   */
  shouldLoadPageHeader: () => {
    cy.get('.pf-c-page__header').should('be.visible')
  },
  /**
   * Navigate the test user to the cluster page within the ACM console.
   */
  whenGoToClusterPage: () => {
    cy.visit('/multicloud/clusters')
    clustersPage.shouldLoad()
  },
}
