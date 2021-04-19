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

  describe(`Search: ${clusterMode.label} Cluster - Create Deployment`, function() {
    before(function() {
      cy.login() // Every individual file requires for us to login during the test execution.
      clusterMode.valueFn().as('clusterName')
    })

    beforeEach(function() {
      searchPage.whenGoToSearchPage()
    })

    it(`[P1][Sev1][${squad}] should create deployment from create resource UI`, function() {
      resourcePage.whenGoToResourcePage()
      resourcePage.whenSelectTargetCluster(this.clusterName)
      resourcePage.whenCreateDeployment(getNamespace(clusterMode.label), getNamespace(clusterMode.label) + '-deployment', 'openshift/hello-openshift')
    })

    it(`[P1][Sev1][${squad}] should verify that deployment resource exist`, function() {
      resourcePage.whenGoToResourcePage()
      resourcePage.whenSelectTargetCluster(this.clusterName)
      resourcePage.whenCreateDeployment(getNamespace(clusterMode.label), getNamespace(clusterMode.label) + '-deployment', 'openshift/hello-openshift', true)
    })
  })
});
