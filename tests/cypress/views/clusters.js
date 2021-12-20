/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

export const clustersPage = {
    whenGoToClusterPage: () => {
        cy.visit('/multicloud/clusters')
    },
    shouldLoad: () => {
        clustersPage.whenGoToClusterPage()
        cy.get('.pf-c-title').should('contain', 'Cluster')
        cy.get('.pf-c-spinner').should('not.exist')
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
                        cy
                            .url()
                            .should(
                                'include',
                                `/search?filters={%22textsearch%22:%22cluster%3A${name}%22}`
                            )
                    )
            })
    },
    whenGoToAddonPage: (managed_cluster) => {
        cy.visit(`/multicloud/clusters/${managed_cluster}/settings`)
    },
    whenAddonAvailable: (flag, managed_cluster, add_on) => {
        clustersPage.whenGoToAddonPage(managed_cluster)
        if (flag === 'true') {
            cy.get('table').get('tbody').get('tr').contains(`${add_on}`)
        } else if (flag === 'false') {
            cy.get('table').get('tbody').get('tr').contains(`${add_on}`).should('not.exist')
        } else {
            throw new Error("'Invalid flag provided'")
        }
    }
}
