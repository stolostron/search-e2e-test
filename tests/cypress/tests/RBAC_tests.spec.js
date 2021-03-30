/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../config'
import { welcomePage } from '../views/welcome'
const rbac_users = ['search-e2e-view-ns', 'search-e2e-edit-ns', 'search-e2e-admin-ns', 'search-e2e-admin-cluster']
const password = Cypress.env('OPTIONS_HUB_PASSWORD')
const IDP = 'search-e2e-htpasswd'

// For Polarion test case IDs RHACM4K-729, RHACM4K-918, RHACM4K-922 and RHACM4K-923
describe('RBAC users to read the Welcome pages and links', function () {
    afterEach(function () {
        cy.logout()
    })
    for (const user of rbac_users)
    {
        var roleAccess = user.split('-')
        it('[P1][Sev1]['+squad+'] As an user with name '+user+' with '+roleAccess[3]+'-role-binding of default '+roleAccess[2]+' role, the user can read the Welcome page.', function () {
            cy.login(user, password, IDP)
            welcomePage.whenGoToWelcomePage()
            welcomePage.validateSvcs()
            welcomePage.validateConnect()
        })
    }
})
