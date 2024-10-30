/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

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
   * Verify the Overview page should correctly display summary section.
   * TODO - verify data & links
   */
  shouldHaveSummarySection: () => {
    cy.get('div.pf-c-card__title')
      .filter(':contains(Clusters)')
      .should('exist')
      .next()
      .within(() => {
        cy.get('tspan').should('contain', 'total clusters')
      })

    cy.get('div.pf-c-card__title')
      .filter(':contains(Application types)')
      .should('exist')
      .next()
      .within(() => {
        cy.get('span').should('contain', 'total applications')
      })

    cy.get('div.pf-c-card__title')
      .filter(':contains(Policies)')
      .should('exist')
      .next()
      .within(() => {
        cy.get('span').should('contain', 'enabled policies')
      })

    cy.get('div.pf-c-card__title').filter(':contains(Cluster version)').should('exist')

    cy.get('div.pf-c-card__title')
      .filter(':contains(Nodes)')
      .should('exist')
      .next()
      .within(() => {
        cy.get('span').should('contain', 'total nodes')
      })

    cy.get('div.pf-c-card__title').filter(':contains(Worker core count)').should('exist')
  },

  /**
   * Verify the Overview page should display insights section.
   * TODO - verify data & links
   */
  shouldHaveInsightsSection: () => {
    cy.get('div.pf-c-card__title').filter(':contains(Insights)').should('exist')

    cy.get('div.pf-c-card__title')
      .filter(':contains(Cluster recommendations)')
      .should('exist')
      .next()
      .within(() => {
        cy.get('span').should('contain', 'clusters affected')
      })

    cy.get('div.pf-c-card__title')
      .filter(':contains(Update risk predictions)')
      .should('exist')
      .next()
      .within(() => {
        cy.get('span').should('contain', 'clusters need to be reviewed before updating')
      })
  },

  /**
   * Verify the Overview page should display cluster health section.
   * TODO - verify data & links
   */
  shouldHaveClusterHealthSection: () => {
    cy.get('div.pf-c-card__title').filter(':contains(Cluster health)').should('exist')

    cy.get('div.pf-c-card__title')
      .filter(':contains(Status)')
      .should('exist')
      .next()
      .within(() => {
        cy.get('tspan').should('contain', 'Ready')
      })

    cy.get('div.pf-c-card__title')
      .filter(':contains(Violations)')
      .should('exist')
      .next()
      .within(() => {
        cy.get('tspan').should('contain', 'No violations')
      })

    cy.get('div.pf-c-card__title')
      .filter(':contains(Cluster add-ons)')
      .should('exist')
      .next()
      .within(() => {
        cy.get('tspan').should('contain', 'Available')
      })
  },

  /**
   * Verify the Overview page should display the saved search section.
   * TODO - verify data & links once saved searches are populated in env.
   */
  shouldHaveSavedSearchSection: () => {
    cy.get('div.pf-c-card__title').filter(':contains(Your view)').should('exist')
  },
}
