/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../../config'
import { cliHelper } from '../../scripts/cliHelper'
import { searchPage } from '../../views/search'

const postfix = Date.now()
const appName = `auto-test-app-${postfix}`

describe('RHACM4K-913: Search - common filter and conditions', function () {
  before(function () {
    cy.generateNamespace(postfix).as('namespace')
  })

  beforeEach(function() {
    searchPage.whenGoToSearchPage()
  })

  it(`[P1][Sev1][${squad}] should create namespace and application`, function() {
    cliHelper.createNamespace(this.namespace)
    cliHelper.createApplication(appName, this.namespace)
  })

  it(`[P1][Sev1][${squad}] should login`, function() {
    cy.login()
  })

  it(`[P2][Sev2][${squad}] should find expected application and delete application`, function () {
    searchPage.shouldFindApplicationInNS(appName, this.namespace)
    searchPage.shouldDeleteApplicationInNS(appName, this.namespace)
    cliHelper.deleteNamespace(this.namespace)
  })
})
