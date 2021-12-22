/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import {tags} from '../../config'
import {searchBar, searchPage} from '../../views/search'
import {cliHelper} from "../../scripts/cliHelper";
import {clustersPage} from "../../views/clusters";

describe('Search: Test "search-collector" add-on function', {tags: [tags.component, '@test']}, function () {
    before(() => {
        // Get name of an imported cluster
        cliHelper.getTargetManagedCluster().as('managedCluster')
        if (this.managedCluster === 'local-cluster') {
            Cypress.on('fail - No managed cluster found', (error, runnable) => {
                throw error;
            });
        }
    })

    it(`RHACM4K-3941: Search function can be disabled on the managed cluster`, {tags: ['@RHACM4K-3941', '@post-release']}, function () {
        /* Verify search-collector can be found on Add-ons page*/
        // Log in yo ACM
        cy.login()
        // Go to 'Add-on' page of a managed cluster and verify 'search-collector' is available
        clustersPage.whenAddonAvailable('true', this.managedCluster, 'search-collector')

        /* Disable search-collector */
        // Flag search-collector to false
        cliHelper.flagSearchCollector('false', this.managedCluster)
        // Go to 'Add-on' page of a managed cluster and verify 'search-collector' is not available
        clustersPage.whenAddonAvailable('false', this.managedCluster, 'search-collector')

        /* Verify Search page */
        // Verify expected warning text exists
        searchPage.whenSearchDisabledOnClusters('true')

        /* Enable search-collector */
        // Flag search-collector to true
        cliHelper.flagSearchCollector('true', this.managedCluster)
        // Go to 'Add-on' page of a managed cluster and verify 'search-collector' is available
        clustersPage.whenAddonAvailable('true', this.managedCluster, 'search-collector')

        /* Verify Search page */
        // Verify warning text does not exists
        searchPage.whenSearchDisabledOnClusters('false')
    })

    it(`RHACM4K-2882: search collector agent addon to reflect the status on hub post installed on managed cluster`, {tags: ['@RHACM4K-2882', '@post-release']}, function () {
        /* Verify search-collector can be found on Add-ons page*/
        // Log in yo ACM
        cy.login()

        /* Disable search-collector */
        // Flag search-collector to false
        cliHelper.flagSearchCollector('false', this.managedCluster)
        // Go to 'Add-on' page of a managed cluster and verify 'search-collector' is not available
        clustersPage.whenAddonAvailable('false', this.managedCluster, 'search-collector')

        /* Verify Search page */
        // Verify expected warning text exists
        searchPage.whenSearchDisabledOnClusters('true')

        /* Verify addon */
        // Go to 'Add-on' page of a managed cluster and verify 'search-collector' is available
        clustersPage.whenAddonAvailable('true', this.managedCluster, 'search-collector')
        // Go to 'Add-on' page of local cluster and verify 'search-collector' is not available
        clustersPage.whenAddonAvailable('false', 'local-cluster', 'search-collector')

        /* Verify search-collector from search bar*/
        // Enter cluster name
        searchBar.whenFilterByCluster(this.managedCluster)
        // Enter kind 'lease'
        searchBar.whenFilterByKind('lease')
        // Enter namespace 'open-cluster-management-agent-addon'
        searchBar.whenFilterByNamespace('open-cluster-management-agent-addon')
        // Enter name 'search-collector'
        searchBar.whenFilterByName('search-collector')
        // Go to details page
        searchPage.whenGoToResourceDetailItemPage(
            'Lease',
            'search-collector'
        )

    })
})


