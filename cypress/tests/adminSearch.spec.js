/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { pageLoader, searchPage, searchBar } from '../views/search'
import { timestamp } from '../support/index'

describe('Login', () => {
  it('page should load', () => {
    cy.login(Cypress.env('OCP_CLUSTER_USER'), Cypress.env('OCP_CLUSTER_PASS'), Cypress.env('OC_IDP'))
    pageLoader.shouldNotExist()
    searchPage.shouldExist()
  })
})

describe('Search', () => {

  it('Search for secret as admin user', () => {
    searchBar.focusSearchBar()
    searchBar.enterTextInSearchBar('kind', '', 'secret')
    searchBar.enterTextInSearchBar('name', '', `my-test-secret-${timestamp}`)
    searchBar.checkTagArray('kind:secret')
    // searchBar.checkSpecificSearchFilter(2, `name:my-test-secret-${timestamp}`)
    // searchBar.verifySearchResult(1, `my-test-secret-${timestamp}`)
  })

})