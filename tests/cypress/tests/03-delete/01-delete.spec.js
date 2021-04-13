/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../../config'
import { cliHelper } from '../../scripts/cliHelper'
import { deploymentDetailPage } from '../../views/deploymentDetailPage'
import { podDetailPage } from '../../views/podDetailPage'
import { resourcePage } from '../../views/resource'
import { searchPage, searchBar } from '../../views/search'

const clusterModes = [{ label: 'Local', valueFn: () => cy.wrap('local-cluster'), skip: false }]//,
                      // { label: 'Managed', valueFn: () => cliHelper.getTargetManagedCluster(), skip: false }];

clusterModes.forEach((clusterMode) => {
  if (clusterMode.skip) {
    return;
  }

  describe(`Search: ${clusterMode.label} Cluster - Delete Resource`, function() {

    before(function() {
      clusterMode.valueFn().as('clusterName')
      cy.generateNamespace().as('namespace')
    })

    beforeEach(function() {
      searchPage.whenGoToSearchPage()
    })

    describe('search resources', function() {
      beforeEach(function() {
        searchBar.whenFilterByClusterAndNamespace(this.clusterName, this.namespace)
      })

      it(`[P2][Sev2][${squad}] should delete deployment`, function() {
        searchBar.whenFilterByKind('deployment')
        searchPage.whenDeleteResourceDetailItem('deployment', this.namespace + '-deployment')
      });

      it(`[P2][Sev2][${squad}] should validate deployment was deleted`, function() {
        searchBar.whenFilterByKind('deployment', true)
        searchBar.whenFilterByName(this.namespace + '-deployment', true)
        searchPage.shouldFindNoResults()
      });

      it(`[P2][Sev2][${squad}] should delete namespace`, function() {
        searchPage.whenDeleteNamespace(this.namespace)
      });

      it(`[P2][Sev2][${squad}] should validate namespace was deleted`, function() {
        searchPage.shouldFindNoResults()
      });
    })
  })
});
