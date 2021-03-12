/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../config'
import { welcomePage, leftNav, userMenu } from '../views/welcome'
var timeoutID

describe('Welcome page', function () {
    before(function () {
        cy.login()
    })

    beforeEach(() => {
        welcomePage.whenGoToWelcomePage()
        timeoutId = setTimeout(() => {
            throw new Error("Test taking too long!")
          }, 60000 * 5);
    })

    after(function () {
        cy.logout()
    })

    afterEach(() => {
        clearTimeout(timeoutID)
    })

    it(`[P1][Sev1][${squad}] should load`, function () {
        welcomePage.shouldExist()
    })

    it(`[P3][Sev3][${squad}] validate links on Welcome page`, function () {
        welcomePage.validateSvcs()
        welcomePage.validateConnect()
    })
    
    // Validate left navigation
    it(`[P3][Sev3][${squad}] should open left navigation`, function () {
        leftNav.validateMenu()
    })

    it(`[P3][Sev3][${squad}] using left navigation - should navigate to Home page`, function () {
        leftNav.goToHome()
    })
    it(`[P3][Sev3][${squad}] using left navigation - should navigate to Overview page`, function () {
        leftNav.goToOverview()
    })

    it(`[P3][Sev3][${squad}] using left navigation - should navigate to Clusters page`, function () {
        leftNav.goToClusters()
    })

    it(`[P3][Sev3][${squad}] using left navigation - should navigate to Bare metal assets page`, function () {
        leftNav.goToBMAssets()
    })

    it(`[P3][Sev3][${squad}] using left navigation - should navigate to Applications page`, function () {
        leftNav.goToApplications()
    })

    it(`[P3][Sev3][${squad}] using left navigation - should navigate to GRC page`, function () {
        leftNav.goToGRC()
    })


    // Validate navigation from header icons
    it(`[P3][Sev3][${squad}] using header icons - should navigate to Search page`, function () {
        userMenu.openSearch()
    })

    /* FIXME: Skipping these test because it's causing intermittent canaries to fails.
        userMenu.openApps()
        userMenu.openResources()
        userMenu.openTerminal()
        userMenu.openInfo()
        userMenu.openUser()
    */

})
