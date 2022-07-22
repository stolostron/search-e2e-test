/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad, tags } from '../config'
import { overviewPage } from '../views/overview'

describe(
  'RHACM4K-1419: Search: Overview page',
  { tags: tags.required },
  function () {
    beforeEach(function () {
      // Log into the cluster ACM console.
      cy.visitAndLogin('/multicloud/home/overview')
    })

    context('UI - Overview page validation', { tags: [] }, function () {
      it(`[P1][Sev1][${squad}] should load and render the overview page`, function () {
        overviewPage.shouldLoad()
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

      it(`[P2][Sev2][${squad}] add credential action works`, function () {
        overviewPage.whenAddCredentialAction()
        overviewPage.shouldLoadAddCredentialPage()
      })

      it(`[P2][Sev2][${squad}] should have link to welcome page from left nav`, function () {
        overviewPage.shouldHaveLeftNavLinkToTargetedPage('Welcome')
      })

      it(`[P2][Sev2][${squad}] should have link to cluster page from left nav`, function () {
        overviewPage.shouldHaveLeftNavLinkToTargetedPage('Clusters')
      })

      it(`[P2][Sev2][${squad}] should have link to host inventory page from left nav`, function () {
        overviewPage.shouldHaveLeftNavLinkToTargetedPage('Host inventory')
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
  }
)
