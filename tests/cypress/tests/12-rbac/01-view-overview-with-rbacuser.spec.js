/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../../config'
import { overviewPage } from '../../views/overview'

const rbac_users = [
  'search-e2e-admin-cluster',
  'search-e2e-admin-ns',
  'search-e2e-view-ns',
  'search-e2e-edit-ns',
]
const password = Cypress.env('OPTIONS_HUB_PASSWORD')
const IDP = 'search-e2e-htpasswd'

describe('RBAC users to read the Overview page', { tags: ['@CANARY', '@ROSA'] },
  function () {
    const overviewPagePolarionIDs = ['731', '921', '919', '920']

    rbac_users.forEach((user, index) => {
      var roleAccess = user.split('-')

      context(`verify: read action for user ${user} with ${roleAccess[2]} role`, { tags: ['@BVT', '@RBAC'] }, function () {
        it(`RHACM4K-${overviewPagePolarionIDs[index]}[P1][Sev1][${squad}] Login: ${user} user`, function () {
          cy.login(user, password, IDP)
        })
  
        it(`RHACM4K-${overviewPagePolarionIDs[index]}[P2][Sev2][${squad}] As an user with name ${user} with ${roleAccess[3]}-role-binding of default ${roleAccess[2]} role, the user can read the Overview page.`, function () {
          overviewPage.whenGoToOverviewPage()
          overviewPage.shouldLoad()
          overviewPage.shouldHaveLinkToSearchPage()
        })
  
        it(`RHACM4K-${overviewPagePolarionIDs[index]}[P1][Sev1][${squad}] Logout: ${user} user`, function () {
          cy.logout()
        })
      })
    })
  }
)
