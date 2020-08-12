/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { pageLoader, searchPage } from '../views/search'

describe('Login', {
  env: {
    OC_IDP: 'search-e2e',
    CYPRESS_OPTIONS_HUB_USER: 'user-viewer',
    CYPRESS_OPTIONS_HUB_PASSWORD : 'pass-viewer'
  }
},() => {
  it('page should load', () => {
    cy.login(Cypress.env('OPTIONS_HUB_USER'), Cypress.env('OPTIONS_HUB_PASSWORD'), Cypress.env('OC_IDP'))
    pageLoader.shouldNotExist()
    searchPage.shouldExist()
  })
})
