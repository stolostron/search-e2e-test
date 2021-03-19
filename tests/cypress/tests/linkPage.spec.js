/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../config'
import { overviewPage } from '../views/overview'
import { clustersPage } from '../views/clusters'

describe('Search: Linked page', function () {
    before(function () {
        cy.login()
    })

    after(function () {
        cy.logout()
    })

    it(`[P2][Sev2][${squad}] overview page should have link to search page`, function () {
        overviewPage.shouldHaveLinkToSearchPage()
    })

    it(`[P2][Sev2][${squad}] clusters page should has link to search page`, function () {
        clustersPage.shouldHaveLinkToSearchPage()
    })
})
