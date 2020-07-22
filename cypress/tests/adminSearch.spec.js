/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { pageLoader, searchPage } from '../views/search'

describe('Login', () => {
  it('page should load', () => {
    cy.login(Cypress.env('OCP_CLUSTER_USER'), Cypress.env('OCP_CLUSTER_PASS'), Cypress.env('OC_IDP'))
    pageLoader.shouldNotExist()
    searchPage.shouldExist()
  })
})

