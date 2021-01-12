/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../config'
import { searchPage } from '../views/search'
import { suggestedTemplate } from '../views/savedSearches'

describe('Search: Verify the suggested search templates', function() {

    before(function() {
      cy.login()
    })
  
    after(function() {
      cy.logout()
    })
    beforeEach(function() {
      searchPage.whenGoToSearchPage()
      
    })
  
    it(`[P3][Sev3][${squad}] should see the workloads template & search tag in search items`, function() {
      suggestedTemplate.whenSelectWorkloads()
    });
    it(`[P3][Sev3][${squad}] should see the unhealthy pods template & search tag in search items`, function() {
      suggestedTemplate.whenSelectUnhealthyPods()
    });
    it(`[P3][Sev3][${squad}] should see the created last hour template & search tag in search items`, function() {
      suggestedTemplate.whenSelectCreatesLastHour()
    });
  
    // Verify the related resources.
    it(`[P3][Sev3][${squad}] should see the workload template & related items details`, function() {
      suggestedTemplate.whenSelectWorkloads()
      suggestedTemplate.whenVerifyRelatedItemsDetails()
    });
  
    // DISABLED:  These are testing the same path as the above test and it's adding 
    //            a high load. Hoping that this can help with our canary issues.
    // it('should see the unhealthy pods template & related items details', function() {
    //   suggestedTemplate.whenSelectUnhealthyPods()
    //   suggestedTemplate.whenVerifyRelatedItemsDetails()
    // });
    // it('should see the created last hour template & related items details', function() {
    //   suggestedTemplate.whenSelectCreatesLastHour()
    //   suggestedTemplate.whenVerifyRelatedItemsDetails()
    // });
  })  