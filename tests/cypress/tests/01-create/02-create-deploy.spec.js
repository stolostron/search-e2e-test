/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../../config'
import { clusterModes } from '../../scripts/cliHelper'
import { resourcePage } from '../../views/resource'
import { searchPage } from '../../views/search'

clusterModes.forEach((clusterMode) => {
  if (clusterMode.skip) {
    return;
  }

  describe('Search: Search in ' + clusterMode.label + ' Cluster', function() {
    before(function() {
      clusterMode.valueFn().as('clusterName')
      cy.getNamespace(clusterMode.label).as('namespace')
    })

    beforeEach(function() {
      searchPage.whenGoToSearchPage()
    })

    it(`[P1][Sev1][${squad}] should create deployment from create resource UI`, function() {
      resourcePage.whenGoToResourcePage()
      resourcePage.whenSelectTargetCluster(this.clusterName)
      resourcePage.whenCreateDeployment(this.namespace, this.namespace + '-deployment', 'openshift/hello-openshift')
    })

    it(`[P1][Sev1][${squad}] should verify that deployment resource exist`, function() {
      resourcePage.whenGoToResourcePage()
      resourcePage.whenSelectTargetCluster(this.clusterName)
      resourcePage.whenCreateDeployment(this.namespace, this.namespace + '-deployment', 'openshift/hello-openshift', true)
    })
  })
});
