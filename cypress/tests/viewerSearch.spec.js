/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { pageLoader, searchPage } from '../views/search'

describe('Login', {
  env: {
    OC_IDP: 'search-e2e',
    OCP_CLUSTER_USER: 'user-viewer',
    OCP_CLUSTER_PASS : 'pass-viewer'
  }
},() => {
  it('page should load', () => {
    cy.login(Cypress.env('OCP_CLUSTER_USER'), Cypress.env('OCP_CLUSTER_PASS'), Cypress.env('OC_IDP'))
    pageLoader.shouldNotExist()
    searchPage.shouldExist()
  })
})