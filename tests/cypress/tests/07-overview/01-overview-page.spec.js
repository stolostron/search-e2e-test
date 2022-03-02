/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad, tags } from '../../config'
import { cliHelper } from '../../scripts/cliHelper'
import { overviewPage } from '../../views/overview'

describe('RHACM4K-1419: Search: Overview page', { tags: [] }, function () {
  context(
    'prereq: user should log into the ACM console',
    { tags: tags.required },
    function () {
      it(`[P1][Sev1][${squad}] should login`, function () {
        cy.login()
      })
    }
  )

  context('UI - overview page validation', { tags: [] }, function () {
    beforeEach(() => {
      cliHelper.checkIfLoggedIn()
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

  context('UI - overview page link validation', { tags: [] }, function () {
    beforeEach(() => {
      cliHelper.checkIfLoggedIn()
      overviewPage.whenGoToOverviewPage()
    })

    it(`[P2][Sev2][${squad}] should have link to welcome page from left nav`, function () {
      overviewPage.shouldHaveLeftNavLinkToTargetedPage('Welcome')
    })

    it(`[P2][Sev2][${squad}] should have link to cluster page from left nav`, function () {
      overviewPage.shouldHaveLeftNavLinkToTargetedPage('Clusters')
    })

    it(`[P2][Sev2][${squad}] should have link to bare metal assets page from left nav`, function () {
      overviewPage.shouldHaveLeftNavLinkToTargetedPage('Bare metal assets')
    })

    it(`[P2][Sev2][${squad}] should have link to automation page from left nav`, function () {
      overviewPage.shouldHaveLeftNavLinkToTargetedPage('Automation')
    })

    it(`[P2][Sev2][${squad}] should have link to application page from left nav`, function () {
      overviewPage.shouldHaveLeftNavLinkToTargetedPage('Applications')
    })

    it(`[P2][Sev2][${squad}] should have link to governance page from left nav`, function () {
      overviewPage.shouldHaveLeftNavLinkToTargetedPage('Governance')
    })

    it(`[P2][Sev2][${squad}] should have link to credential page from left nav`, function () {
      overviewPage.shouldHaveLeftNavLinkToTargetedPage('Credentials')
    })
  })
})
