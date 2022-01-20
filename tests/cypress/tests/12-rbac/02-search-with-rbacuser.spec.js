/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import {squad, tags} from '../../config'
import {overviewPage} from '../../views/overview'
import {cliHelper} from "../../scripts/cliHelper";
import {searchBar, searchPage} from "../../views/search";
import {podDetailPage} from "../../views/podDetailPage";

// Under Progress

// const rbac_users = [
//   'e2e-admin-cluster',
//   'e2e-admin-ns',
//   'e2e-view-ns',
//   'e2e-edit-ns',
// ]

const rbac_users = [
  'e2e-admin-cluster'
]

// const password = Cypress.env('OPTIONS_HUB_PASSWORD')
const password = 'acmqe'
const IDP = 'grc-e2e-htpasswd'

let ignore

if (Cypress.env('TEST_ENV') === 'rosa') {
    ignore = ['@RBAC']
}

describe('RBAC users to use search page', {tags: ['@rbac']}, function () {
    before(() => {
        // Get name of an imported cluster
        cliHelper.getTargetManagedCluster().as('managedCluster')
        if (this.managedCluster === 'local-cluster'){
            Cypress.on('fail - No managed cluster found', (error, runnable) => { throw error; });
        }
        // Log in yo ACM
        cy.login(rbac_users[0], password, IDP)
    })

    it(`RHACM4K-1644: Verify read, update and delete action of user with cluster-manager-admin role`, {tags: ['@RHACM4K-1644', '@post-release']}, function () {
        /* Verify common search functions */
        searchPage.whenGoToSearchPage()
        // Search for a managed cluster
        // searchBar.whenFilterByCluster(this.managedCluster)
        searchBar.whenFilterByCluster('local-cluster')
        // Filter by 'pods'
        searchBar.whenFilterByKind('pod')
        // Filter by pod's name - using a random pod for testing
        searchBar.whenFilterByName('alertmanager-main-0')
                // Go to details page
        searchPage.whenGoToResourceDetailItemPage(
            'pod',
            'alertmanager-main-0'
        )
        // Check for logs
        podDetailPage.whenClickOnLogsTab()
        podDetailPage.shouldSeeLogs('lookup alertmanager-main-0.alertmanager-operated on')

        /* Delete a pod */
        searchPage.whenDeleteResourceDetailItem('pod', 'alertmanager-main-0')
    })
})



