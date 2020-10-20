/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { use } from 'chai'
import { searchPage } from '../views/search'
import { welcomePage, leftNav, userMenu } from '../views/welcome'

describe('Validate links on welcome page', function () {
    before(function () {
        cy.login()
        searchPage.whenGoToWelcomePage()
    })

    after(function () {
        cy.logout()
    })

    it('Load the welcome page', function () {
        welcomePage.shouldExist()
    })

    it('Validate links on main welcome page', function () {
        welcomePage.validateSvcs()
        welcomePage.validateConnect()
    })

    it('Validate menu items on left nav bar', function () {
        leftNav.openMenu()
        leftNav.goToHome()
        leftNav.goToOverview()
        leftNav.goToTopology()
        leftNav.goToClusters()
        leftNav.goToBMAssets()
        leftNav.goToApplications()
        leftNav.goToGRC()
    })

    it('Validate nav icons on header', function () {
        userMenu.openApps()
        userMenu.openSearch()
        userMenu.openResources()
        userMenu.openTerminal()
        userMenu.openInfo()
        userMenu.openUser()
    })
})