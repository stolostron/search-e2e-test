/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

import { squad, tags } from '../config'
import { searchBar, searchPage } from '../views/search'

const clusterMode = {
  deployment: 'search-api',
  label: 'Local',
  namespace: 'open-cluster-management',
  skip: false,
  valueFn: () => cy.wrap('local-cluster'),
}

describe(`Search in ${clusterMode.label} Cluster`, { tags: tags.env }, function () {
  before(function () {
    // Setting the cluster mode cluster as the current instance cluster.
    clusterMode.valueFn().as('clusterName')
  })

  beforeEach(function () {
    // Log into the cluster ACM console.
    cy.visitAndLogin('/multicloud/home/search')
  })

  context('Console-Search page validation', { tags: tags.modes }, function () {
    it(`[P1][Sev1][${squad}] should load and render the search page`, function () {
      searchPage.shouldLoad()
      searchPage.shouldRenderSavedSearchesTab()
      searchPage.shouldRenderSearchBar()
      searchPage.shouldRenderSuggestedSearches()
    })
  })

  context('Console-Search verify results with common filter and condition', { tags: tags.modes }, function () {
    beforeEach(function () {
      searchPage.shouldFindNamespaceInCluster(clusterMode.namespace, this.clusterName)
    })

    it(`[P2][Sev2][${squad}] should work kind filter for Deployment`, function () {
      searchBar.whenFilterByKind('Deployment')
      searchBar.whenRunSearchQuery()
      searchBar.whenUsePagination(50)
      searchPage.shouldFindResourceDetailItem('Deployment', clusterMode.deployment, clusterMode.namespace)
    })

    it(`[P3][Sev3][${squad}] should have the expected relationships`, function () {
      searchBar.whenRunSearchQuery()
      searchPage.whenExpandRelationshipTiles()
      searchPage.shouldFindRelationshipTile('Cluster')
    })
  })
})
