/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import {tags} from '../../config'
import {searchBar, searchPage} from '../../views/search'
import {podDetailPage} from "../../views/podDetailPage";
import {cliHelper} from "../../scripts/cliHelper";

// Needs fixing - Do not use now
// describe('Search: Test resiliency', {tags: ['@e2e', '@Obs']}, function () {
//     before(() => {
//         // Log in yo ACM
//         cy.login()
//         // Get search-operator pod's full name
//         cliHelper.findFullPodName('search-operator').as('pod')
//         // Get default storage class
//         cliHelper.findDefaultStorageClass().as('sc')
//         // Apply valid CR
//         cliHelper.updateSearchCustomizationCR('true',this.sc)
//     })
//
//     after(() => {
//         // Apply valid CR
//         cliHelper.updateSearchCustomizationCR('true',this.sc)
//     })
//
//     it(`RHACM4K-1694: Search: Search resiliency verification`, {tags: ['@RHACM4K-1694', '@post-release']}, function () {
//         /* Verify CR 'searchoperator' is created and search-operator pod is running */
//         //Go to 'search' page
//         searchPage.whenGoToSearchPage()
//         // Verify 'search' page loads
//         searchPage.shouldLoad()
//         // Filter by 'pods'
//         searchBar.whenFilterByKind('pod')
//         // Filter by pod's name
//         searchBar.whenFilterByName(this.pod)
//         // Go to details page
//         searchPage.whenGoToResourceDetailItemPage(
//             'pod',
//             this.pod
//         )
//         // Check for logs
//         podDetailPage.whenClickOnLogsTab()
//         podDetailPage.shouldSeeLogs('RedisGraph Pod with PVC Running')
//
//         /* Disable customization CR persistence flag and verify logs */
//         // Go to 'search' page
//         searchPage.whenGoToSearchPage()
//         // Disable customization CR persistence flag
//         cliHelper.updateSearchCustomizationCR('false', this.sc)
//         // Filter by 'pods'
//         searchBar.whenFilterByKind('pod')
//         // Filter by pod's name
//         searchBar.whenFilterByName(this.pod)
//         // Go to details page
//         searchPage.whenGoToResourceDetailItemPage(
//             'pod',
//             this.pod
//         )
//         // Check for logs
//         podDetailPage.whenClickOnLogsTab()
//         podDetailPage.shouldSeeLogs('RedisGraph Pod Running with Persistence disabled')
//
//         /* Enable customization CR persistence flag and verify logs */
//         // Go to 'search' page
//         searchPage.whenGoToSearchPage()
//         // Enable customization CR persistence flag
//         cliHelper.updateSearchCustomizationCR('true')
//
//         /* Apply invalid customization CR, verify logs */
//         // Wait for 20s
//         cy.wait(2000)
//         // Go to 'search' page
//         searchPage.whenGoToSearchPage()
//         // Apply invalid CR
//         cliHelper.updateSearchCustomizationCR('true')
//         // Wait for 20s
//         cy.wait(2000)
//         // Filter by 'pods'
//         searchBar.whenFilterByKind('pod')
//         // Filter by pod's name
//         searchBar.whenFilterByName(this.pod)
//         // Go to details page
//         searchPage.whenGoToResourceDetailItemPage(
//             'pod',
//             this.pod
//         )
//         // Check for logs
//         podDetailPage.whenClickOnLogsTab()
//         podDetailPage.shouldSeeLogs('RedisGraph Pod UnScheduleable - likely PVC mount problem')
//
//         /* Apply valid customization CR, verify logs */
//         // Go to 'search' page
//         searchPage.whenGoToSearchPage()
//         // Apply valid CR
//         cliHelper.updateSearchCustomizationCR('true',this.sc)
//         // Wait for 20s
//         cy.wait(2000)
//         // Filter by 'pods'
//         searchBar.whenFilterByKind('pod')
//         // Filter by pod's name
//         searchBar.whenFilterByName(this.pod)
//         // Go to details page
//         searchPage.whenGoToResourceDetailItemPage(
//             'pod',
//             this.pod
//         )
//         // Check for logs
//         podDetailPage.whenClickOnLogsTab()
//         podDetailPage.shouldSeeLogs('PVC volume set up successfully')
//     })
// })


