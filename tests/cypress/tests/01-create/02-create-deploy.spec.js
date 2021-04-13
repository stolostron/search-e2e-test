/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../../config'
import { resourcePage } from '../../views/resource'
import { searchPage } from '../../views/search'
import { clusterModes } from '../../scripts/cliHelper'

clusterModes.forEach((clusterMode) => {
  if (clusterMode.skip) {
    return;
  }

  describe(`Search: ${clusterMode.label} Cluster - Create Deployment`, function() {
    beforeEach(function() {
      searchPage.whenGoToSearchPage()
    })

    it(`[P1][Sev1][${squad}] should create deployment from create resource UI`, function() {
      resourcePage.whenGoToResourcePage()
      resourcePage.whenSelectTargetCluster(this.clusterName)
      resourcePage.whenCreateDeployment(this.namespace, this.namespace + '-deployment', 'openshift/hello-openshift')
    })

    it(`[P1][Sev1][${squad}] should verify that deployment resource exist`, function() {
      cy.waitUsingSLA()
      resourcePage.whenGoToResourcePage()
      resourcePage.whenSelectTargetCluster(this.clusterName)
      resourcePage.whenCreateDeployment(this.namespace, this.namespace + '-deployment', 'openshift/hello-openshift', true)
      cy.logout() // WORKAROUND, we shouldn't need to logout to see new resources. Potential product bug to investigate.
      cy.login()
    })
  })
});
