/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../config'
import { clustersPage } from '../views/clusters'
import { deploymentDetailPage } from '../views/deploymentDetailPage'
import { podDetailPage } from '../views/podDetailPage'
import { resourcePage } from '../views/resource'
import { searchPage, searchBar } from '../views/search'

const clusterModes = [{ label: 'Local', valueFn: () => cy.wrap('local-cluster'), },
                      { label: 'Managed', valueFn: () => clustersPage.givenManagedCluster(), skip: true }];  //FIXME Jorge - Temporarily disabled to break down migration into smaller PRs

clusterModes.forEach((clusterMode) =>   {

  if (clusterMode.skip) {
    return;
  }

  describe('Search: Search in ' + clusterMode.label + ' Cluster', function() {

    before(function() {
      cy.login()
      clusterMode.valueFn().as('clusterName')
      cy.generateNamespace().as('namespace')
      searchPage.whenGoToSearchPage()
    })

    after(function() {
      cy.logout()
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

    it(`[P1][Sev1][${squad}] should create deployment from create resource UI`, function() {
      resourcePage.whenGoToResourcePage()
        resourcePage.whenSelectTargetCluster(this.clusterName)
        resourcePage.whenCreateDeployment(this.namespace, this.namespace + '-deployment', 'openshift/hello-openshift')
        // FIXME Jorge - WORKAROUND, we shouldn't need to logout to see new resources. Potential product bug to investigate.
        cy.wait(5000)
        cy.logout()
        cy.login() 
    })

    
    describe('search resources', function() {
      
      beforeEach(function() {
        searchPage.whenGoToSearchPage()
        searchBar.whenFilterByClusterAndNamespace(this.clusterName, this.namespace)
      })

      after(function() {
        searchPage.whenDeleteNamespace(this.namespace, { ignoreIfDoesNotExist: true })
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
        cy.go('back')
  
        searchPage.shouldFindRelationshipTile('pod', '2')
      })

      it(`[P2][Sev2][${squad}] should delete deployment`, function() {
        searchBar.whenFilterByKind('deployment')
        searchPage.whenDeleteResourceDetailItem('deployment', this.namespace + '-deployment')
        searchPage.shouldFindNoResults()
      });

      it(`[P2][Sev2][${squad}] should delete namespace`, function() {
        searchPage.whenDeleteNamespace(this.namespace)
        searchPage.shouldFindNoResults()
      });
    })
  })
});
