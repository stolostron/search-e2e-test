/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

import { squad, tags } from '../config'
import { overviewPage } from '../views/overview'

describe('RHACM4K-1419: Overview page', { tags: tags.env }, function () {
  beforeEach(function () {
    // Log into the cluster ACM console.
    cy.visitAndLogin('/multicloud/home/overview')
  })

  context('Console-Overview page validation', { tags: tags.modes }, function () {
    it(`[P1][Sev1][${squad}] should load and render the overview page`, function () {
      overviewPage.shouldLoad()
    })

    it(`[P2][Sev2][${squad}] should have fleet summary section`, function () {
      overviewPage.shouldHaveSummarySection()
    })

    it(`[P2][Sev2][${squad}] should have insights section`, function () {
      overviewPage.shouldHaveInsightsSection()
    })

    it(`[P2][Sev2][${squad}] should have cluster health section`, function () {
      overviewPage.shouldHaveClusterHealthSection()
    })

    // Implement once there are saved searches in env.
    // it(`[P2][Sev2][${squad}] should have saved search section`, function () {
    //   overviewPage.shouldHaveSavedSearchSection()
    // })
  })
})
