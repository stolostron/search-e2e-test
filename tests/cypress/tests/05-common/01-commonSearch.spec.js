/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../../config'
import { cliHelper, getNamespace } from '../../scripts/cliHelper'
import { searchPage } from '../../views/search'

const postfix = Date.now()
const appName = `auto-test-app-${postfix}`

describe('RHACM4K-913: Search - common filter and conditions', function () {
  before(function() {
    cy.login() // Every individual file requires for us to login during the test execution.
  })

  beforeEach(function() {
    searchPage.whenGoToSearchPage()
  })

  it(`[P1][Sev1][${squad}] should create namespace and application`, function() {
    cliHelper.createNamespace(getNamespace('Local'))
    cliHelper.createApplication(appName, getNamespace('Local'))
    cy.wait(2000) // Adding a wait since to ensure that exec command finishes.
    cy.logout() // WORKAROUND, we shouldn't need to logout to see new resources. Potential product bug to investigate.
    cy.login()
  })

  it(`[P2][Sev2][${squad}] should find expected application and delete application`, function () {
    searchPage.shouldFindApplicationInNS(appName, getNamespace('Local'))
    searchPage.shouldDeleteApplicationInNS(appName, getNamespace('Local'))
    cliHelper.deleteNamespace(getNamespace('Local'))
  })
})
