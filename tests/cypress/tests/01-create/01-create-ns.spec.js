/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad, namespace } from '../../config'
import { resourcePage } from '../../views/resource'
import { searchPage, searchBar } from '../../views/search'
import { clusterModes } from '../../scripts/cliHelper'

clusterModes.forEach((clusterMode) => {
  if (clusterMode.skip) {
    return;
  }

  describe(`Search: ${clusterMode.label} Cluster - Create NS`, function() {
    before(function() {
      clusterMode.valueFn().as('clusterName')
    })

    beforeEach(function() {
      searchPage.whenGoToSearchPage()
    })

    it(`[P1][Sev1][${squad}] should not see any cluster and namespace`, function() {
      searchBar.whenFilterByClusterAndNamespace(this.clusterName, namespace)
      searchPage.shouldFindNoResults()
    })

    it(`[P1][Sev1][${squad}] should create namespace from create resource UI`, function() {
      resourcePage.whenGoToResourcePage()
      resourcePage.whenSelectTargetCluster(this.clusterName)
      resourcePage.whenCreateNamespace(namespace)
    })

    it(`[P1][Sev1][${squad}] should verify that namespace already exist`, function() {
      resourcePage.whenGoToResourcePage()
      resourcePage.whenSelectTargetCluster(this.clusterName)
      resourcePage.whenCreateNamespace(namespace, true)
    })
  })
});
