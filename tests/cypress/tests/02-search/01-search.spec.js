/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad } from '../../config'
import { cliHelper } from '../../scripts/cliHelper'
import { searchPage, searchBar } from '../../views/search'

const clusterModes = [
  { label: 'Local', valueFn: () => cy.wrap('local-cluster'), skip: false },
  {
    label: 'Managed',
    valueFn: () => cliHelper.getTargetManagedCluster(),
    skip: true,
  },
]

clusterModes.forEach((clusterMode) => {
  if (clusterMode.skip) {
    return
  }

  describe('Search: Search in ' + clusterMode.label + ' Cluster', function () {
    before(function () {
      clusterMode.valueFn().as('clusterName')
      cy.generateNamespace().as('namespace')
    })

    before(function () {
      cliHelper.createNamespace(this.namespace)
      cliHelper.createDeployment(
        this.namespace + '-deployment',
        this.namespace,
        'openshift/hello-openshift'
      )
      cy.login()
    })

    beforeEach(function () {
      searchPage.whenGoToSearchPage()
    })

    after(function () {
      cliHelper.deleteNamespace(this.namespace)
    })

    it(`[P1][Sev1][${squad}] should load the search page`, function () {
      searchPage.shouldLoad()
    })

    it(`[P1][Sev1][${squad}] should verify that namespace resource exist`, function () {
      searchBar.whenFilterByNamespace(this.namespace)
      searchBar.whenFilterByCluster(this.clusterName)
      searchPage.shouldLoadResults()
    })

    it(`[P1][Sev1][${squad}] should verify that deployment resource exist`, function () {
      searchBar.whenFilterByNamespace(this.namespace)
      searchBar.whenFilterByCluster(this.clusterName)
      searchBar.whenFilterByKind('deployment')
      searchPage.whenGetResourceTableRow(
        'deployment',
        this.namespace + '-deployment'
      )
    })

    describe('search resources', function () {
      beforeEach(function () {
        searchBar.whenFilterByNamespace(this.namespace)
        searchBar.whenFilterByCluster(this.clusterName)
        searchPage.shouldLoadResults()
      })

      it(`[P3][Sev3][${squad}] should have expected count of relationships`, function () {
        searchPage.whenExpandRelationshipTiles()
        searchPage.shouldFindRelationshipTile('cluster', '1')
        searchPage.shouldFindRelationshipTile('deployment', '1')
        searchPage.shouldFindRelationshipTile('pod', '1')
      })

      it(`[P1][Sev1][${squad}] should work kind filter for deployment`, function () {
        searchBar.whenFilterByKind('deployment')
        searchPage.shouldFindResourceDetailItem(
          'deployment',
          this.namespace + '-deployment'
        )
      })

      it(`[P1][Sev1][${squad}] should work kind filter for pod`, function () {
        searchBar.whenFilterByKind('pod')
        searchPage.shouldFindResourceDetailItem(
          'pod',
          this.namespace + '-deployment-'
        )
      })
    })
  })
})
