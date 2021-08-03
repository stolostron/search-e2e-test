/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../../config'
import { cliHelper } from '../../scripts/cliHelper'
import { searchPage, searchBar } from '../../views/search'
import { deploymentDetailPage } from '../../views/deploymentDetailPage'

const clusterModes = [{ label: 'Local', valueFn: () => cy.wrap('local-cluster'), skip: false, namespace: cliHelper.generateNamespace() },
                      { label: 'Managed', valueFn: () => cliHelper.getTargetManagedCluster(), skip: false, namespace: cliHelper.generateNamespace() }];

clusterModes.forEach((clusterMode) => {
  if (clusterMode.skip) {
    return;
  }

  describe(`Search: Create resource in ${clusterMode.label} Cluster`, function() {
    before(function() {
      clusterMode.valueFn().as('clusterName')
    })

    after(function() {
      if (clusterMode.label === 'Managed') {
        cy.log('Logging back into hub the cluster')
        cy.exec('oc login --token=sha256~vBkt0K1vYaBQP0JLA_I-W65Yge3AtxuAqMuzWEbKtjI --server=https://api.ocp-482-h97mj.dev07.red-chesterfield.com:6443')
        // cliHelper.login(Cypress.env('OPTIONS_HUB_BASEDOMAIN'), Cypress.env('OPTIONS_HUB_USER'), Cypress.env('OPTIONS_HUB_PASSWORD'))
      }
    })

    context(`prereq: create resource with oc command`, function() {
      if (clusterMode.label === 'Managed') {
        it(`[P1][Sev1][${squad}] should log into managed cluster`, function() {
          cy.exec('oc login --token=sha256~rknAUVwR2I7pP2eOvhhjeYvz3NYH_fZKDBmJjgEmdaM --server=https://api.sno-managed-n4945.dev07.red-chesterfield.com:6443')
          // cliHelper.login(Cypress.env('OPTIONS_MANAGED_BASEDOMAIN'), Cypress.env('OPTIONS_MANAGED_USER'), Cypress.env('OPTIONS_MANAGED_PASSWORD'))
        })
      }

      it(`[P1][Sev1][${squad}] should create namespace resource`, function() {
        cliHelper.createNamespace(clusterMode.namespace)
      })

      it(`[P1][Sev1][${squad}] should create deployment resource`, function() {
        cliHelper.createDeployment(clusterMode.namespace + '-deployment', clusterMode.namespace, 'openshift/hello-openshift')
      })
    })
  })
})

clusterModes.forEach((clusterMode) => {
  if (clusterMode.skip) {
    return;
  }

  describe('Search: Search in ' + clusterMode.label + ' Cluster', function() {
    before(function() {
      clusterMode.valueFn().as('clusterName')
    })

    after(function() {
      cliHelper.deleteNamespace(clusterMode.namespace)
    })

    context('search resources', function() {
      before(function() {
        if (clusterMode.label !== 'Managed') {
          cy.login()
        }
      })

      beforeEach(function() {
        searchPage.whenGoToSearchPage()
        searchBar.whenFilterByNamespace(clusterMode.namespace)
        searchBar.whenFilterByCluster(this.clusterName)
        searchPage.shouldLoadResults()
      })

      it(`[P2][Sev2][${squad}] should delete pod`, function() {
        searchBar.whenFilterByKind('pod')
        searchPage.whenDeleteResourceDetailItem('pod', clusterMode.namespace + '-deployment')
        searchPage.shouldBeResourceDetailItemCreatedFewSecondsAgo('pod', clusterMode.namespace + '-deployment')
      });

      it(`[P3][Sev3][${squad}] should edit yaml and scale deployment`, function() {
        searchBar.whenFilterByKind('deployment')
        searchPage.whenGoToResourceDetailItemPage('deployment', clusterMode.namespace + '-deployment')
        deploymentDetailPage.whenScaleReplicasTo(2)
      })

      it(`[P3][Sev3][${squad}] should verify that the deployment scaled`, function() {
        searchBar.whenFilterByKind('deployment')
        searchPage.whenGetResourceTableRow('deployment', clusterMode.namespace + '-deployment')
        searchPage.shouldFindRelationshipTile('pod', '2')
      })
    })
  })
});
