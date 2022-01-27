/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import {searchBar, searchPage} from '../../views/search'
import {podDetailPage} from "../../views/podDetailPage";
import {cliHelper} from "../../scripts/cliHelper";
var util = require('util')

// Needs fixing - Do not use now. SC is passing as 'Undefined'
describe('Search: Test resiliency', {tags: ['@e2e', '@Obs']}, function () {
    before(() => {
        // Log in yo ACM
        cy.login()
        // Get search-operator pod's full name
        cliHelper.findFullPodName('search-operator').as('pod')
        // Get default storage class
        cliHelper.findDefaultStorageClass().as('sc')
    })

    it(`RHACM4K-1694: Search: Search resiliency verification`, {tags: ['@RHACM4K-1694', '@post-release']}, function () {
        /* Enable customization CR persistence flag/ Verify CR 'searchoperator' is created and search-operator pod is running */
        //Go to 'search' page
        searchPage.whenGoToSearchPage()
        // Enable customization CR persistence flag
        cliHelper.updateSearchCustomizationCR('true',true, this.sc)
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
        cliHelper.updateSearchCustomizationCR('false',true, this.sc)
        // Wait for 20s
        cy.wait(20000)
        // Verify pod logs from the back-end
        cliHelper.verifyPodLogs(this.pod, 'ocm', 'RedisGraph Pod Running with Persistence disabled')
        // // Filter by 'pods'
        // searchBar.whenFilterByKind('pod')
        // // Filter by pod's name
        // searchBar.whenFilterByName(this.pod)
        // // Go to details page
        // searchPage.whenGoToResourceDetailItemPage(
        //     'pod',
        //     this.pod
        // )
        // // Check for logs
        // podDetailPage.whenClickOnLogsTab()
        // podDetailPage.shouldSeeLogs('RedisGraph Pod Running with Persistence disabled')

        /* Enable customization CR persistence flag and verify logs */
        // Enable customization CR persistence flag
        cliHelper.updateSearchCustomizationCR('true',true, this.sc)

        // Needs improvement
        /* Apply invalid customization CR, verify logs */
        // Go to 'search' page
        searchPage.whenGoToSearchPage()
        // Apply invalid CR
        cliHelper.updateSearchCustomizationCR('true',false, this.sc)
        // Wait for 20s
        cy.wait(20000)
        // Need to do this part from the back-end -->
        cliHelper.verifyPodLogs(this.pod, 'ocm', 'RedisGraph Pod UnScheduleable - likely PVC mount problem')
        // searchBar.whenFilterByKind('pod')
        // // Filter by pod's name
        // searchBar.whenFilterByName(this.pod)
        // // Go to details page
        // searchPage.whenGoToResourceDetailItemPage(
        //     'pod',
        //     this.pod
        // )
        // // Check for logs
        // podDetailPage.whenClickOnLogsTab()
        // podDetailPage.shouldSeeLogs('RedisGraph Pod UnScheduleable - likely PVC mount problem')
        // <--

        /* Apply valid customization CR, verify logs */
        // Go to 'search' page
        searchPage.whenGoToSearchPage()
        // Apply valid CR
        cliHelper.updateSearchCustomizationCR('true', true, this.sc)
        // Wait for 20s
        cy.wait(20000)
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


