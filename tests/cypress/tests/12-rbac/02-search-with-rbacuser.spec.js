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
//   'search-e2e-admin-cluster',
//   'search-e2e-admin-ns',
//   'search-e2e-view-ns',
//   'search-e2e-edit-ns',
// ]

const rbac_users = [
    'test-cluster-manager-admin'
    // 'search-e2e-admin-ns',
    // 'search-e2e-view-ns',
    // 'search-e2e-edit-ns',
]

// const password = Cypress.env('OPTIONS_HUB_PASSWORD')
const password = 'test-RBAC-4-e2e'
const IDP = 'htpasswd'

let ignore

if (Cypress.env('TEST_ENV') === 'rosa') {
    ignore = ['@RBAC']
}

describe('RBAC users to use search page', {tags: tags.env,}, function () {
    before(() => {
        // Get name of an imported cluster
        cliHelper.getTargetManagedCluster().as('managedCluster')
        if (this.managedCluster === 'local-cluster'){
            Cypress.on('fail - No managed cluster found', (error, runnable) => { throw error; });
        }
    })

    it(`RHACM4K-1644: Verify read, update and delete action of user with cluster-manager-admin role`, {tags: ['@RHACM4K-1644', '@post-release']}, function () {
        /* Verify CR 'searchoperator' is created and search-operator pod is running */
        // Log in yo ACM
        cy.login(user, password, IDP)
        searchPage.whenGoToSearchPage()
        searchBar.whenFilterByNamespace('ocm')
        searchBar.whenFilterByCluster(this.managedCluster)
        searchPage.shouldLoadResults()

    })
})



