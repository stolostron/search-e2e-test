/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../../config'
import { searchPage } from '../../views/search'

describe('Search: Search Page', function() {
  after(function() {
    cy.logout()
  })

  it(`[P1][Sev1][${squad}] should load the search page`, function() {
    searchPage.shouldLoad()
  })
})
