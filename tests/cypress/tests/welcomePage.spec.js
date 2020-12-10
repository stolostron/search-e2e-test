/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { searchPage, squad } from '../views/search'
import { welcomePage, leftNav, userMenu } from '../views/welcome'

describe('Search: Welcome page', function () {
    before(function () {
        cy.login()
        searchPage.whenGoToWelcomePage()
    })

    after(function () {
        cy.logout()
    })

    it(`[P1][Sev1][${squad}] should load`, function () {
        welcomePage.shouldExist()
    })

    it(`[P3][Sev3][${squad}] should be validated for the links on main page`, function () {
        welcomePage.validateSvcs()
        welcomePage.validateConnect()
    })

    it(`[P3][Sev3][${squad}] should be validated for the menu items on left nav bar`, function () {
        leftNav.openMenu()
        leftNav.goToHome()
        leftNav.goToOverview()
        leftNav.goToTopology()
        leftNav.goToClusters()
        leftNav.goToBMAssets()
        leftNav.goToApplications()
        leftNav.goToGRC()
    })

    /* Skipping this test because it's intermittently becoming unresponsive and causing the canaries to fail.
    it('should be validated for the nav icons on the header', function () {
        userMenu.openApps()
        userMenu.openSearch()
        userMenu.openResources()
        userMenu.openTerminal()
        userMenu.openInfo()
        userMenu.openUser()
    })
    */
})
