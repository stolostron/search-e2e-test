/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../../config'
import { resourcePage } from '../../views/resource'
import { searchPage } from '../../views/search'
import { clusterModes, getNamespace } from '../../scripts/cliHelper'

clusterModes.forEach((clusterMode) => {
  if (clusterMode.skip) {
    return;
  }

  describe(`Search: ${clusterMode.label} Cluster - Create namespace`, function() {
    before(function() {
      cy.login() // Every individual file requires for us to login during the test execution.
      clusterMode.valueFn().as('clusterName')
    })

    beforeEach(function() {
      searchPage.whenGoToSearchPage()
    })

    it(`[P1][Sev1][${squad}] should create namespace from create resource UI`, function() {
      resourcePage.whenGoToResourcePage()
      resourcePage.whenSelectTargetCluster(this.clusterName)
      resourcePage.whenCreateNamespace(getNamespace(clusterMode.label))
    })

    it(`[P1][Sev1][${squad}] should verify that namespace already exist`, function() {
      resourcePage.whenGoToResourcePage()
      resourcePage.whenSelectTargetCluster(this.clusterName)
      resourcePage.whenCreateNamespace(getNamespace(clusterMode.label), true)
    })
  })
});
