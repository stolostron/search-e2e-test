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
   * Verify that the Cluster page should have accessible links to the Search page.
   */
  shouldHaveLinkToSearchPage: () => {
    clustersPage.shouldLoad()
    cy.get('.pf-c-table tbody')
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
                `/multicloud/home/search?filters={%22textsearch%22:%22cluster%3A${name}%22}`
              )
          )
      })
  },
  /**
   * Verify that the Cluster page should have loaded correctly.
   */
  shouldLoad: () => {
    clustersPage.whenGoToClusterPage()
    cy.get('.pf-c-empty-state__icon').should('not.exist')
    cy.get('.pf-c-skeleton').should('not.exist')
    cy.get('.pf-c-title').filter(':contains(Clusters)').should('exist')
  },
  /**
   * Navigate the test user to the Cluster page within the ACM console.
   */
  whenGoToClusterPage: () => {
    cy.visit('/multicloud/infrastructure/clusters')
  },
}
