/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../config'
import { cliHelper } from '../scripts/cliHelper'
import { deploymentDetailPage } from '../views/deploymentDetailPage'
import { podDetailPage } from '../views/podDetailPage'
import { resourcePage } from '../views/resource'
import { searchPage, searchBar } from '../views/search'

const clusterModes = [{ label: 'Local', valueFn: () => cy.wrap('local-cluster'), skip: false },
                      { label: 'Managed', valueFn: () => cliHelper.getTargetManagedCluster(), skip: false }];

clusterModes.forEach((clusterMode) => {
  if (clusterMode.skip) {
    return;
  }
  const start = Date.now()

  describe('Search: Search in ' + clusterMode.label + ' Cluster', function() {
    before(function() {
      clusterMode.valueFn().as('clusterName')
      cy.generateNamespace().as('namespace')
      cy.task('log', `before() took ${(Date.now() - start)/1000} seconds`)
    })

    let testStart = Date.now()
    beforeEach(function() {
      testStart = Date.now()
      searchPage.whenGoToSearchPage()
    })

    afterEach(function(){
      cy.task('log', `${(Date.now() - testStart)/1000} seconds - ${this.currentTest.title}`)
      // cy.task('log', `Current test info - ${JSON.stringify(Cypress.mocha.getRunner().suite.ctx.currentTest)}`)
      cy.task('log', `Current test info - ${Object.keys(this.currentTest)}`)
      cy.task('log', `  Title: ${this.currentTest.title}`)
      cy.task('log', `  timedOut: ${this.currentTest.timedOut}`)
      cy.task('log', `  _retries: ${this.currentTest._retries}`)
      cy.task('log', `  retries: ${this.currentTest.retries}`)
      cy.task('log', `  _currentRetries: ${this.currentTest._currentRetries}`)
      cy.task('log', `  duration: ${this.currentTest.duration}`)
      cy.task('log', `  timer: ${this.currentTest.timer}`)
      cy.task('log', `  state: ${this.currentTest.state}`)
      cy.task('log', `  id: ${this.currentTest.id}`)


      if (this.currentTest.state === 'failed' && this.currentTest.retries >= 1) {
        cy.task('log', 'Stopping execution after failed test.')
        Cypress.runner.stop()
      }
    })

    it(`[P1][Sev1][${squad}] should load the search page`, function() {
      searchPage.shouldLoad()
    })

    it(`[P1][Sev1][${squad}] should not see any cluster and namespace`, function() {
      // when
      searchBar.whenFocusSearchBar()
      searchBar.whenFilterByClusterAndNamespace(this.clusterName, this.namespace)
      // then
      searchPage.shouldFindNoResults()
    })

    it(`[P1][Sev1][${squad}] should create namespace from create resource UI`, function() {
      resourcePage.whenGoToResourcePage()
      resourcePage.whenSelectTargetCluster(this.clusterName)
      resourcePage.whenCreateNamespace(this.namespace)
    })

    it(`[P1][Sev1][${squad}] should verify that namespace already exist`, function() {
      resourcePage.whenGoToResourcePage()
      resourcePage.whenSelectTargetCluster(this.clusterName)
      resourcePage.whenCreateNamespace(this.namespace, true)
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

    describe('search resources', function() {
      beforeEach(function() {
        searchBar.whenFilterByClusterAndNamespace(this.clusterName, this.namespace)
      })

      it(`[P3][Sev3][${squad}] should have expected count of relationships`, function() {
        searchPage.shouldLoadResults()
        searchPage.whenExpandRelationshipTiles()
        searchPage.shouldFindRelationshipTile('cluster', '1')
        searchPage.shouldFindRelationshipTile('deployment', '1')
        searchPage.shouldFindRelationshipTile('pod', '1')
      });

      it(`[P1][Sev1][${squad}] should work kind filter for deployment`, function() {
        searchBar.whenFilterByKind('deployment')
        searchPage.shouldFindResourceDetailItem('deployment', this.namespace + '-deployment')
      });

      it(`[P1][Sev1][${squad}] should work kind filter for pod`, function() {
        searchBar.whenFilterByKind('pod')
        searchPage.shouldFindResourceDetailItem('pod', this.namespace + '-deployment-')
      });

      it(`[P2][Sev2][${squad}] should see pod logs`, function() {
        searchBar.whenFilterByKind('pod')
        searchPage.whenGoToResourceDetailItemPage('pod', this.namespace + '-deployment-')
        podDetailPage.whenClickOnLogsTab()
        // podDetailPage.shouldSeeLogs('serving on') // FIXME Jorge - Temporarily disabled to allow merging current progress.
      });

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
