/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../views/search'
import { overviewPage } from '../views/overview'

describe('Search: Overview page', function () {
    before(function () {
        cy.login()
        overviewPage.whenGoToOverviewPage()
    })

    after(function () {
        cy.logout()
    })

    it(`[P1][Sev1][${squad}] should load`, function () {
        overviewPage.shouldExist()
    })

    

})
