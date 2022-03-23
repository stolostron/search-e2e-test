/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

export const clustersPage = {
  whenGoToClusterPage: () => {
    cy.visit('/multicloud/infrastructure/clusters')
  },
  shouldLoad: () => {
    clustersPage.whenGoToClusterPage()
    cy.get('.pf-c-empty-state__icon').within(() => {
      cy.get('.pf-c-spinner').should('not.exist')
    })
    cy.get('.pf-c-title').filter(':contains(Cluster)')
  },
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
            cy.url().should(
              'include',
              // TODO update to `/multicloud/home/search?filters={%22textsearch%22:%22cluster%3A${name}%22}` when clusters page is finished
              `/search?filters={%22textsearch%22:%22cluster%3A${name}%22}`
            )
          )
      })
  },
}
