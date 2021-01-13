/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

export const clustersPage = {
  givenManagedCluster: () => {
    cy.visit('/multicloud/clusters');

    return cy.contains('table.resource-table th', 'Name', {timeout: 6000})
             .invoke('index')
             .then((index) => cy.get('table.resource-table tbody tr').filter(':not(:contains("local-cluster"))').filter(':not(:contains("console-ui-test-"))').eq(0).get('td').eq(index).invoke('text'));
  },
  shouldExist: () => {
    cy.get('.pf-c-title').should('contain', 'Cluster management')
  },
  shouldHaveLinkToSearchPage: () => {
    cy.visit('/multicloud/clusters')
    cy.get('.pf-c-table tbody').find('tr').first().then((c) => {
      let name = c.find('[data-label="Name"] a').text()
      cy.wrap(c).find('.pf-c-dropdown__toggle').click().get('a').contains('Search cluster').click().then(() => cy.url().should('include', `/search?filters={%22textsearch%22:%22cluster%3A${name}%22}`))
    })
  }
}
