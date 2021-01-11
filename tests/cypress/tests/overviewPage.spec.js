/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../config'
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
        overviewPage.shouldLoad()
    })

    // TODO: Skipping this test until link gets updated
    // it(`[P2][Sev2][${squad}] add cloud connecttion action works`, function () {
    //     overviewPage.whenAddCloudConnectionAction()
    //     overviewPage.shouldLoadCloudConnectionPage()
    //     cy.go('back')
    // })

})
