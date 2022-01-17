/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad, tags } from '../../config'
import { overviewPage } from '../../views/overview'

const rbac_users = [
  'search-e2e-admin-cluster',
  'search-e2e-admin-ns',
  'search-e2e-view-ns',
  'search-e2e-edit-ns',
]
const password = process.env.CYPRESS_RBAC_PASSWORD
const IDP = 'grc-e2e-htpasswd'

let ignore

if (Cypress.env('TEST_ENV') === 'rosa') {
  ignore = ['@RBAC']
}

describe('RBAC users to read the Overview page', { tags: ['@rbac']},
  function () {
    const overviewPagePolarionIDs = ['731', '921', '919', '920']

    rbac_users.forEach((user, index) => {
      var roleAccess = user.split('-')

      context(`RHACM4K-${overviewPagePolarionIDs[index]} - verify: read action for user ${user} with ${roleAccess[2]} role`, { tags: ignore ? ignore : tags.modes }, function () {
        it(`[P1][Sev1][${squad}] Login: ${user} user`, { tags: tags.required }, function () {
          cy.login(user, password, IDP)
        })
  
        it(`[P2][Sev2][${squad}] As an user with name ${user} with ${roleAccess[3]}-role-binding of default ${roleAccess[2]} role, the user can read the Overview page.`, function () {
          overviewPage.whenGoToOverviewPage()
          overviewPage.shouldLoad()
          overviewPage.shouldHaveLinkToSearchPage()
        })
  
        it(`[P1][Sev1][${squad}] Logout: ${user} user`, function () {
          cy.logout()
        })
      })
    })
  }
)
