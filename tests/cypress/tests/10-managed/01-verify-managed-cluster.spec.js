/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad, tags } from '../../config'
import { cliHelper } from '../../scripts/cliHelper'
import { searchBar, searchPage } from '../../views/search'

describe(
  'RHACM4K-912: Search: Verify the managed cluster info in the search page',
  { tags: tags.env },
  function () {
    before(function () {
      cliHelper.getTargetManagedCluster().as('clusterName')
    })

    beforeEach(function () {
      // Log into the cluster ACM console.
      cy.visitAndLogin('/multicloud/home/welcome')
      searchPage.whenGoToSearchPage()
    })

    it(`[P3][Sev3][${squad}] should validate the endpoint version for the managed clusters are accurate`, function () {
      searchPage.shouldValidateManagedCluster()
    })

    context(
      'verify: managed cluster resource endpoint',
      { tags: tags.modes },
      () => {

        beforeEach(function() {
          searchPage.shouldFindKindInCluster('pod', this.clusterName)
          searchBar.whenEnterTextInSearchBar('namespace')
          searchPage.shouldSelectFirstSuggestionValue()
        })

        it(`[P3][Sev3][${squad}] should verify endpoint pods are all in running state`, function () {
          searchPage.shouldVerifyManagedClusterPodsAreRunning()
        })

        it(`[P3][Sev3][${squad}] should verify the yaml information is correct and there are no errors in the logs`, function () {
          searchPage.shouldVerifyManagedClusterPodsAreRunning()
          searchPage.shouldVerifyPodsLogsInResourceTable()
        })
      }
    )
  }
)
