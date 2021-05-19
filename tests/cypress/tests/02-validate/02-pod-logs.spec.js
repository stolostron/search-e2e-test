/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../../config'
import { cliHelper } from '../../scripts/cliHelper'
import { searchPage, searchBar } from '../../views/search'
import { podDetailPage } from '../../views/podDetailPage'

const clusterModes = [{ label: 'Local', valueFn: () => cy.wrap('local-cluster'), skip: false },
                      { label: 'Managed', valueFn: () => cliHelper.getTargetManagedCluster(), skip: true }];

clusterModes.forEach((clusterMode) => {
  if (clusterMode.skip) {
    cy.task('log', `WARNING: Skipping tests for ${clusterMode.label} cluster`);
    return;
  }

  describe('Search: Search in ' + clusterMode.label + ' Cluster', function() {
    before(function() {
      clusterMode.valueFn().as('clusterName')
      cy.generateNamespace().as('namespace')
    })

    before(function() {
      cliHelper.createNamespace(this.namespace)
      cliHelper.createDeployment(this.namespace + '-deployment', this.namespace, 'openshift/hello-openshift')
      cy.login()
    })

    beforeEach(function() {
      searchPage.whenGoToSearchPage()
    })

    after(function() {
      cliHelper.deleteNamespace(this.namespace)
      // cy.logout()
    })

    describe('search resources', function() {
      beforeEach(function() {
        searchBar.whenFilterByNamespace(this.namespace)
        searchBar.whenFilterByCluster(this.clusterName)
        searchPage.shouldLoadResults()
      })
      
      it(`[P2][Sev2][${squad}] should see pod logs`, function() {
        searchBar.whenFilterByKind('pod')
        searchPage.whenGoToResourceDetailItemPage('pod', this.namespace + '-deployment-')
        podDetailPage.whenClickOnLogsTab()
        podDetailPage.shouldSeeLogs('serving on')
      });
    })
  })
});
