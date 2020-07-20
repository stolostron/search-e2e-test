/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { pageLoader, searchPage } from '../views/search'

before(()=>{

})

describe('Login', () => {
  it('page should load', () => {
    cy.visit('/multicloud/search')
    pageLoader.shouldNotExist()
    searchPage.shouldExist(e)
  })
})
