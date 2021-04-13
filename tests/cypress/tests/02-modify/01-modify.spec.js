/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../../config'
import { deploymentDetailPage } from '../../views/deploymentDetailPage'
import { searchPage, searchBar } from '../../views/search'

const clusterModes = [{ label: 'Local', valueFn: () => cy.wrap('local-cluster'), skip: false }]//,
                      // { label: 'Managed', valueFn: () => cliHelper.getTargetManagedCluster(), skip: false }];

clusterModes.forEach((clusterMode) => {
  if (clusterMode.skip) {
    return;
  }

  describe(`Search: ${clusterMode.label} Cluster - Modify Resource`, function() {
    before(function() {
      clusterMode.valueFn().as('clusterName')
      cy.generateNamespace().as('namespace')
    })

    beforeEach(function() {
      searchPage.whenGoToSearchPage()
    })

    beforeEach(function() {
      searchBar.whenFilterByClusterAndNamespace(this.clusterName, this.namespace)
    })

    it(`[P2][Sev2][${squad}] should delete pod`, function() {
      searchBar.whenFilterByKind('pod')
      searchPage.whenDeleteResourceDetailItem('pod', this.namespace + '-deployment')
      searchPage.shouldBeResourceDetailItemCreatedFewSecondsAgo('pod', this.namespace + '-deployment')
    });

    it(`[P3][Sev3][${squad}] should scale deployment`, function() {
      searchBar.whenFilterByKind('deployment')
      searchPage.whenGoToResourceDetailItemPage('deployment', this.namespace + '-deployment')
      deploymentDetailPage.whenScaleReplicasTo(2)
      cy.waitUsingSLA() // WORKAROUND to wait for resource to get indexed. Better solution is to retry instead of a hard wait.
    })

    it(`[P3][Sev3][${squad}] should verify that the deployment scaled`, function() {
      searchBar.whenFilterByKind('deployment')
      searchBar.whenFilterByName(this.namespace + '-deployment')
      searchPage.shouldFindRelationshipTile('pod', '2')
    })
  })
});
