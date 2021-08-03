/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../../config'
import { overviewPage } from '../../views/overview'

describe('Search: Overview page', function () {
  before(function() {
    cy.login()
  })

  beforeEach(() => {
    overviewPage.whenGoToOverviewPage()
  })

  it(`[P1][Sev1][${squad}] should load the overview page`, function () {
    overviewPage.shouldLoad()
  })

  it(`[P2][Sev2][${squad}] should have refresh options`, function () {
    overviewPage.shouldHaveRefreshDropdown()
  })

  it(`[P2][Sev2][${squad}] should have clusters provider card`, function () {
    overviewPage.shouldHaveClusterProviderCard()
  })

  it(`[P2][Sev2][${squad}] should have clusters summary breakdown`, function () {
    overviewPage.shouldHaveClusterSummary()
  })

  it(`[P2][Sev2][${squad}] should have link to search page`, function () {
    overviewPage.shouldHaveLinkToSearchPage()
  })

  it(`[P2][Sev2][${squad}] add cloud connection action works`, function () {
    overviewPage.whenAddProviderConnectionAction()
    overviewPage.shouldLoadProviderConnectionPage()
  })
})
