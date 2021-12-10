/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import {tags} from '../../config'
import {searchBar, searchPage} from '../../views/search'
import {podDetailPage} from "../../views/podDetailPage";
import {cliHelper} from "../../scripts/cliHelper";

// Under progress
describe('Search: Test "Search" disability function', {tags: tags.component}, function () {
    before(() => {
        // Get name of an imported cluster
        cliHelper.getTargetManagedCluster().as('managedCluster')
        if (this.managedCluster === 'local-cluster'){
            Cypress.on('fail - No managed cluster found', (error, runnable) => { throw error; });
        }
    })

    it(`RHACM4K-3941: Search function can be disabled on the managed cluster`, {tags: ['@RHACM4K-3941', '@post-release']}, function () {
        /* Verify CR 'searchoperator' is created and search-operator pod is running */
        // Log in yo ACM
        cy.login()
        // Update 'klusterletaddonconfigs' file
        searchPage.whenGoToSearchPage()
        // Verify 'search' page loads
        searchPage.shouldLoad()
        // Filter by 'pods'
        searchBar.whenFilterByKind('pod')
        // Filter by pod's name
        searchBar.whenFilterByName(this.pod)
        // Go to details page
        searchPage.whenGoToResourceDetailItemPage(
            'pod',
            this.pod
        )
        // Check for logs
        podDetailPage.whenClickOnLogsTab()
        podDetailPage.shouldSeeLogs('RedisGraph Pod with PVC Running')

        /* Disable customization CR persistence flag and verify logs */
        // Go to 'search' page
        searchPage.whenGoToSearchPage()
        // Disable customization CR persistence flag
        cliHelper.updateSearchCustomizationCR('false', true)
        // Filter by 'pods'
        searchBar.whenFilterByKind('pod')
        // Filter by pod's name
        searchBar.whenFilterByName(this.pod)
        // Go to details page
        searchPage.whenGoToResourceDetailItemPage(
            'pod',
            this.pod
        )
        // Check for logs
        podDetailPage.whenClickOnLogsTab()
        podDetailPage.shouldSeeLogs('RedisGraph Pod Running with Persistence disabled')

        /* Enable customization CR persistence flag and verify logs */
        // Go to 'search' page
        searchPage.whenGoToSearchPage()
        // Enable customization CR persistence flag
        cliHelper.updateSearchCustomizationCR('true', true)

        /* Apply invalid customization CR, verify logs */
        // Wait for 20s
        cy.wait(2000)
        // Go to 'search' page
        searchPage.whenGoToSearchPage()
        // Apply invalid CR
        cliHelper.updateSearchCustomizationCR('true', false)
        // Wait for 20s
        cy.wait(2000)
        // Filter by 'pods'
        searchBar.whenFilterByKind('pod')
        // Filter by pod's name
        searchBar.whenFilterByName(this.pod)
        // Go to details page
        searchPage.whenGoToResourceDetailItemPage(
            'pod',
            this.pod
        )
        // Check for logs
        podDetailPage.whenClickOnLogsTab()
        podDetailPage.shouldSeeLogs('RedisGraph Pod UnScheduleable - likely PVC mount problem')

        /* Apply valid customization CR, verify logs */
        // Go to 'search' page
        searchPage.whenGoToSearchPage()
        // Apply invalid CR
        cliHelper.updateSearchCustomizationCR('true', true)
        // Wait for 20s
        cy.wait(2000)
        // Filter by 'pods'
        searchBar.whenFilterByKind('pod')
        // Filter by pod's name
        searchBar.whenFilterByName(this.pod)
        // Go to details page
        searchPage.whenGoToResourceDetailItemPage(
            'pod',
            this.pod
        )
        // Check for logs
        podDetailPage.whenClickOnLogsTab()
        podDetailPage.shouldSeeLogs('PVC volume set up successfully')

    })
})


