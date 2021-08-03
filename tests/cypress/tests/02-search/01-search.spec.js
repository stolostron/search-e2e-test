/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../../config'
import { cliHelper } from '../../scripts/cliHelper'
import { searchPage, searchBar } from '../../views/search'

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
        cliHelper.login(Cypress.env('OPTIONS_HUB_BASEDOMAIN'), Cypress.env('OPTIONS_HUB_USER'), Cypress.env('OPTIONS_HUB_PASSWORD'))
      }
    })

    context(`prereq: create resource with oc command`, function() {
      if (clusterMode.label === 'Managed') {
        it(`[P1][Sev1][${squad}] should log into managed cluster`, function() {
          cliHelper.login(Cypress.env('OPTIONS_MANAGED_BASEDOMAIN'), Cypress.env('OPTIONS_MANAGED_USER'), Cypress.env('OPTIONS_MANAGED_PASSWORD'))
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

      it(`[P3][Sev3][${squad}] should have expected count of relationships`, function() {
        searchPage.whenExpandRelationshipTiles()
        searchPage.shouldFindRelationshipTile('cluster', '1')
        searchPage.shouldFindRelationshipTile('deployment', '1')
        searchPage.shouldFindRelationshipTile('pod', '1')
      });

      it(`[P1][Sev1][${squad}] should work kind filter for deployment`, function() {
        searchBar.whenFilterByKind('deployment')
        searchPage.shouldFindResourceDetailItem('deployment', clusterMode.namespace + '-deployment')
      });

      it(`[P1][Sev1][${squad}] should work kind filter for pod`, function() {
        searchBar.whenFilterByKind('pod')
        searchPage.shouldFindResourceDetailItem('pod', clusterMode.namespace + '-deployment-')
      });
    })
  })
});
