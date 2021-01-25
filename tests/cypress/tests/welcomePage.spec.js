/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../config'
import { welcomePage, leftNav, userMenu } from '../views/welcome'

describe('Welcome page', function () {
    before(function () {
        cy.login()
        welcomePage.whenGoToWelcomePage()
    })

    after(function () {
        cy.logout()
    })

    it(`[P1][Sev1][${squad}] should load`, function () {
        welcomePage.shouldExist()
    })

    it(`[P3][Sev3][${squad}] validate links on Welcome page`, function () {
        welcomePage.validateSvcs()
        welcomePage.validateConnect()
    })

    
    // Validate left navigation
    it(`[P3][Sev3][${squad}] should open left navigation`, () => {
        leftNav.validateMenu()
    })

    it(`[P3][Sev3][${squad}] using left navigation - should navigate to Home page`, () => {
        leftNav.goToHome()
    })
    it(`[P3][Sev3][${squad}] using left navigation - should navigate to Overview page`, () => {
        leftNav.goToOverview()
    })

    it(`[P3][Sev3][${squad}] using left navigation - should navigate to Clusters page`, () => {
        leftNav.goToClusters()
    })

    it(`[P3][Sev3][${squad}] using left navigation - should navigate to Bare metal assets page`, () => {
        leftNav.goToBMAssets()
    })

    it(`[P3][Sev3][${squad}] using left navigation - should navigate to Applications page`, () => {
        leftNav.goToApplications()
    })

    it(`[P3][Sev3][${squad}] using left navigation - should navigate to GRC page`, () => {
        leftNav.goToGRC()
    })


    // Validate navigation from header icons
    it(`[P3][Sev3][${squad}] using header icons - should navigate to Search page`, () => {
        userMenu.openSearch()
    })

    /* FIXME: Skipping these test because it's causing intermittent canaries to fails.
        userMenu.openApps()
        userMenu.openSearch()
        userMenu.openResources()
        userMenu.openTerminal()
        userMenu.openInfo()
        userMenu.openUser()
    */

})
