/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad, tags } from '../../config'
import { searchPage, searchBar } from '../../views/search'

// Set filter registry for the test run.
const filters = [
  { type: 'apigroup', skip: false },
  { type: 'container', skip: false },
  { type: 'created', skip: false },
  { type: 'kind', skip: false },
  { type: 'namespace', skip: false },
  { type: 'status', skip: false },
]

describe.skip(
  'RHACM4K-537: Search: Search using filters',
  { tags: tags.env },
  function () {
    beforeEach(function () {
      // Log into the cluster ACM console.
      cy.visitAndLogin('/multicloud/home/welcome')
      searchPage.whenGoToSearchPage()
    })

    context(
      `verify: broad spectrum of search result`,
      { tags: tags.modes },
      function () {
        filters.forEach((f) => {
          if (f.skip) {
            return
          }

          it(`[P1][Sev1][${squad}] Search using "${f.type}" filter`, function () {
            searchBar.whenSelectFirstSuggestedValue(f.type)
          })
        })
      }
    )
  }
)
