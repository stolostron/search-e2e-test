/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../config'
import { overviewPage } from '../views/overview'

const rbac_users = ['search-e2e-admin-cluster', 'search-e2e-admin-ns', 'search-e2e-view-ns', 'search-e2e-edit-ns']
const password = Cypress.env('OPTIONS_HUB_PASSWORD')
const IDP = 'search-e2e-htpasswd'
var skip = false

describe('RBAC users to read the Overview page', function () {
    const overviewPagePolarionIDs = ['731', '921', '919', '920']
    afterEach(function () {
        if (!skip) { // Adding a skip, since by default we are logging out at the end.
            cy.logout()
        }
    })
    for (const [index, user] of rbac_users.entries())
    {
        var roleAccess = user.split('-')
        it('RHACM4K-'+overviewPagePolarionIDs[index]+'[P1][Sev1]['+squad+'] As an user with name '+user+' with '+roleAccess[3]+'-role-binding of default '+roleAccess[2]+' role, the user can read the Overview page.', function () {
            cy.login(user, password, IDP)
            overviewPage.whenGoToOverviewPage()
            overviewPage.shouldLoad()
            overviewPage.shouldHaveLinkToSearchPage()
        })

        if (index === rbac_users.length - 1) {
            skip = true
        }
    }
})
