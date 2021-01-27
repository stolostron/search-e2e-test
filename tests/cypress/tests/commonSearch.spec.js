/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../config'
import { cliHelper } from '../scripts/cliHelper'
import { searchPage } from '../views/search'

describe('RHACM4K-913: Search - common filter and conditions', function () {
    before(function () {
        cy.login()
    })

    after(function () {
        cy.logout()
    })

    it(`[P2][Sev2][${squad}] should find expected application and delete application`, function () {
        let appName = 'auto-test-app' + Date.now()
        cy.generateNamespace().as("namespace")
        cliHelper.createNamespace(this.namespace)
        cliHelper.createApplication(appName, this.namespace)
        searchPage.whenGoToSearchPage()
        searchPage.shouldFindApplicationInNS(appName, this.namespace)
        searchPage.shouldDeleteApplicationInNS(appName, this.namespace)
        cliHelper.deleteNamespace(this.namespace)
    })
})
