/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad, tags } from '../../config'
import { application, namespace } from '../../../common-lib/resources'
import {
  cliHelper,
  generateNewMultiResourceState,
  resetNewMultiResourceState,
} from '../../scripts/cliHelper'
import { searchPage } from '../../views/search'

// Generate namespace for resource instances.
const ns = cliHelper.generateNamespace()

// Generate resources for the test instance.
const resources = [namespace(ns), application(ns)]

describe(
  'RHACM4K-913: Search - Common filter and conditions',
  { tags: tags.env },
  function () {
    before(function () {
      // Resetting test state to new state.
      resetNewMultiResourceState(resources)
    })

    beforeEach(function () {
      // Log into the cluster ACM console.
      cy.visitAndLogin('/multicloud/home/welcome')

      // Generate new resource state for the test environment.
      generateNewMultiResourceState(resources)
      searchPage.whenGoToSearchPage()
    })

    after(function () {
      // Attempt to cleanup resources that were created during the test run execution.
      cliHelper.deleteResource(resources[0])
    })

    context(
      'verify: search result with common filter and conditions',
      { tags: tags.modes },
      function () {
        it(`[P2][Sev2][${squad}] should find expected application and delete application`, function () {
          searchPage.shouldFindKindResourceInNamespace(
            resources[1].kind,
            resources[1].name,
            resources[1].namespace
          )
          searchPage.shouldDeleteKindResourceInNameSpace(
            resources[1].kind,
            resources[1].name,
            resources[1].namespace
          )
        })
      }
    )
  }
)
