/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { clustersPage } from '../views/clusters'
import { deploymentDetailPage } from '../views/deploymentDetailPage'
import { podDetailPage } from '../views/podDetailPage'
import { resourcePage } from '../views/resource'
import { pageLoader, searchPage, searchBar } from '../views/search'

const clusterModes = [{ label: 'Local', valueFn: () => cy.wrap('local-cluster')}, 
                      { label: 'Managed', valueFn: () => clustersPage.givenManagedCluster() }];

clusterModes.forEach((clusterMode) =>   {
  describe('Search in ' + clusterMode.label + ' Cluster', function() {

    before(function() {
      cy.login()
      clusterMode.valueFn().as('clusterName')
      cy.generateNamespace().as('namespace')
      searchPage.whenGoToSearchPage()
    })
  
    after(function() {
      cy.logout()
    })
  
    it('should load the search page', function() {
      pageLoader.shouldNotExist()
      searchPage.shouldExist()
    })
  
    it('should not see any cluster and namespace', function() {
      // when
      searchBar.whenFocusSearchBar()
      searchBar.whenFilterByClusterAndNamespace(this.clusterName, this.namespace)
      // then
      searchPage.shouldFindNoResults()
    })
  
    describe('create namespace and deployment resources', function() {
      before(function() {
        searchPage.whenGoToSearchPage()
        // given namespace
        resourcePage.whenGoToResourcePage()
        resourcePage.whenSelectTargetCluster(this.clusterName)
        resourcePage.whenCreateNamespace(this.namespace)
  
        // given deployment
        resourcePage.whenGoToResourcePage()
        resourcePage.whenSelectTargetCluster(this.clusterName)
        resourcePage.whenCreateDeployment(this.namespace, this.namespace + '-deployment', 'openshift/hello-openshift')
      })
  
      beforeEach(function() {
        searchPage.whenGoToSearchPage()
        searchBar.whenFocusSearchBar()
        searchBar.whenFilterByClusterAndNamespace(this.clusterName, this.namespace)
      })
  
      it('should have expected count of resource tiles', function() {
        // SMELL: Running on local cluster takes more time to namespaces to be created
        cy.wait(90000).reload()

        searchPage.shouldFindQuickFilter('cluster', '1')
        searchPage.shouldFindQuickFilter('deployment', '1')
        searchPage.shouldFindQuickFilter('pod', '1')
      });
    
      it('should work kind filter for deployment', function() {
        searchBar.whenFilterByKind('deployment')
        searchPage.shouldFindResourceDetailItem('deployment', this.namespace + '-deployment')
      });
  
      it('should work kind filter for deployment', function() {
        searchBar.whenFilterByKind('pod')
        searchPage.shouldFindResourceDetailItem('pod', this.namespace + '-deployment-')
      });
  
      it('should see pod logs', function() {
        searchBar.whenFilterByKind('pod')
        searchPage.whenGoToResourceDetailItemPage('pod', this.namespace + '-deployment-')
        podDetailPage.whenClickOnLogsTag()
        podDetailPage.shouldSeeLogs('serving on')
      });
  
      it('should delete pod', function() {
        searchBar.whenFilterByKind('pod')
        searchPage.whenDeleteResourceDetailItem('pod', this.namespace + '-deployment')
        // SMELL: But the result page is not asynced updated... To be improved in separate ticket
        cy.wait(5000).reload()
    
        searchPage.shouldBeResourceDetailItemCreatedFewSecondsAgo('pod', this.namespace + '-deployment')
      });
  
      it('should scale deployment', function() {
        searchBar.whenFilterByKind('deployment')
        searchPage.whenGoToResourceDetailItemPage('deployment', this.namespace + '-deployment')
        deploymentDetailPage.whenScaleReplicasTo(2)
        // SMELL: But the result page is not asynced updated... To be improved in separate ticket
        cy.go('back').wait(5000).reload()
  
        searchPage.shouldFindQuickFilter('pod', '2')
      })
  
      it('should delete deployment', function() {
        searchBar.whenFilterByKind('deployment')
        searchPage.whenDeleteResourceDetailItem('deployment', this.namespace + '-deployment')
        // SMELL: But the result page is not asynced updated... To be improved in separate ticket
        cy.wait(20000).reload()
    
        searchPage.shouldFindNoResults()
      });
  
      it('should delete namespace', function() {
        searchPage.whenGoToSearchPage()
        searchBar.whenFocusSearchBar()
        searchBar.whenFilterByCluster(this.clusterName)
        searchBar.whenFilterByKind('namespace')
        searchBar.whenFilterByName(this.namespace)
        searchPage.whenDeleteResourceDetailItem('namespace', this.namespace)
        // SMELL: But the result page is not asynced updated... To be improved in separate ticket
        cy.wait(60000).reload()
  
        // then deployment is not found
        searchPage.shouldFindNoResults()
      });
    })
    
  })
})