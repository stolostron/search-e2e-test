/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad, tags } from '../../config'
import { namespace } from '../../../common-lib/resources'
import { savedSearches } from '../../views/savedSearches'
import {
  cliHelper,
  generateNewResourceState,
  resetNewResourceState,
} from '../../scripts/cliHelper'
import { searchBar, searchPage } from '../../views/search'

// Generate namespace for test resources.
const ns = cliHelper.generateNamespace()

// Generate resources for the test instance.
const resource = namespace(ns)

const queryDefaultNamespaceName = `${resource.name}-default`
const queryDefaultNamespaceDesc = `This is searching that the cluster should have ${resource.name} namespace.`

const queryEditNamespaceName = `[E2E] ${resource.name}-edit`
const queryEditNamespaceDesc = `[Created by Search E2E automation] This is searching that the cluster should have ${resource.name} namespace.-2`

describe(
  'RHACM4K-412 - Search: Saved searches',
  { tags: tags.env },
  function () {
    before(function () {
      // Resetting test state to new state.
      resetNewResourceState(resource)
    })

    beforeEach(function () {
      // Log into the cluster ACM console.
      cy.visitAndLogin('/multicloud/home/welcome')

      // Generate new resource state for the test environment.
      generateNewResourceState(resource, { wait: 3000 })
      searchPage.whenGoToSearchPage()
    })

    after(function () {
      // Attempt to cleanup resources that were created during the test run execution.
      cliHelper.deleteResource(resource, { failOnNonZeroExit: false })
    })

    context(
      'verify: saved searches resource actions',
      { tags: tags.modes },
      function () {
        it(`[P2][Sev2][${squad}] should verify that the namespace is available`, function () {
          searchBar.whenFilterByNamespace(resource.name)
          searchPage.shouldLoadResults()
        })

        it(`[P2][Sev2][${squad}] should be able to save current search`, function () {
          savedSearches.saveClusterNamespaceSearch(
            'local-cluster',
            resource.name,
            queryDefaultNamespaceName,
            queryDefaultNamespaceDesc
          )
        })

        it(`[P2][Sev2][${squad}] should be able to find the saved search`, function () {
          savedSearches.getSavedSearch(queryDefaultNamespaceName)
        })

        it(`[P2][Sev2][${squad}] should be able to edit the saved searches`, function () {
          savedSearches.editSavedSearch(
            resource.name,
            queryEditNamespaceName,
            queryEditNamespaceDesc
          )
        })

        it(`[P2][Sev2][${squad}] should be able to revert back the edited saved searches`, function () {
          savedSearches.editSavedSearch(
            queryEditNamespaceName,
            queryDefaultNamespaceName,
            queryDefaultNamespaceDesc
          )
        })

        it(`[P2][Sev2][${squad}] should be able to share the saved searches`, function () {
          savedSearches.shareSavedSearch(queryDefaultNamespaceName)
        })

        it(`[P2][Sev2][${squad}] should be able to delete the saved searches ${ns}`, function () {
          savedSearches.whenDeleteSavedSearch(queryDefaultNamespaceName)
        })

        it(`[P2][Sev2][${squad}] should be able to verify the delete saved searches ${ns}`, function () {
          savedSearches.shouldNotExist(queryDefaultNamespaceName)
        })
      }
    )
  }
)
