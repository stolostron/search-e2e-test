/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../../config/index'
import { searchPage } from '../../views/search'

describe('Search: Search Page', () => {
  beforeEach(function() {
    searchPage.whenGoToSearchPage()
  })

  it(`[P1][Sev1][${squad}] should load the search page`, function() {
    searchPage.shouldLoad()
  })
})
