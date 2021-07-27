/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../../config'
import { searchPage } from '../../views/search'

const tabs = ['Documentation', 'About']

describe('RHACM4K-1420 - UI - header validation for version and doc', function() {
  before(function() {
    cy.login()
  })

  beforeEach(function() {
    searchPage.whenGoToSearchPage()
  })

  tabs.forEach(tab => {
    it(`[P1][Sev1][${squad}] should click on the "info" icon on the upper right side of the header and click the ${tab} button`, function() {
      searchPage.shouldLoad()
      searchPage.whenToClickHelpIcon()
      searchPage.whenToClickTabInHelpIcon(tab)
    })
  });
})