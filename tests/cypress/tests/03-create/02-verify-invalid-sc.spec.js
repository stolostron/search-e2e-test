/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import {squad, tags} from '../../config'
import {searchBar, searchPage} from '../../views/search'
import {podDetailPage} from "../../views/podDetailPage";
import {cliHelper} from "../../scripts/cliHelper";


describe('RHACM4K-1694: Search: search resiliency verification', {tags: []}, function () {
    context('prereq: user should log into the ACM console', {tags: tags.required}, function () {
        it(`[P1][Sev1][${squad}] should login`, function () {
            cy.login()
        })
    })

    context('search resources: verify CR searchoperator is created and search-operator pod is running', {tags: []}, function () {
        beforeEach(function () {
            cliHelper.findFullPodName('search-operator').as('pod')
            searchPage.whenGoToSearchPage()
        })

        it(`[P2][Sev2][${squad}] should load the search page`, function () {
            searchPage.shouldLoad()
        })

        it(`[P1][Sev1][${squad}] should work kind filter for pods`, function () {
            searchBar.whenFilterByKind('pod')
            searchBar.whenFilterByName(this.pod)
            searchPage.whenGoToResourceDetailItemPage(
                'pod',
                this.pod
            )

            // Check for logs
            podDetailPage.whenClickOnLogsTab()
            podDetailPage.shouldSeeLogs('RedisGraph Pod with PVC Running')
        })

        it(`[P2][Sev2][${squad}] Disable customization CR persistence flag and verify logs `, function () {
            // Disable customization CR persistence flag
            cliHelper.updateSearchCustomizationCR('false')
            searchBar.whenFilterByKind('pod')
            searchBar.whenFilterByName(this.pod)
            searchPage.whenGoToResourceDetailItemPage(
                'pod',
                this.pod
            )

            // Check for logs
            podDetailPage.whenClickOnLogsTab()
            podDetailPage.shouldSeeLogs('RedisGraph Pod Running with Persistence disabled')
        })

        it(`[P2][Sev2][${squad}] Enable customization CR persistence flag and verify logs `, function () {
            // Enable customization CR persistence flag
            cliHelper.updateSearchCustomizationCR('true')
            searchBar.whenFilterByKind('pod')
            searchBar.whenFilterByName(this.pod)
            searchPage.whenGoToResourceDetailItemPage(
                'pod',
                this.pod
            )

            // Check for logs
            podDetailPage.whenClickOnLogsTab()
            podDetailPage.shouldSeeLogs('RedisGraph Pod with PVC Running')
        })
    })
})