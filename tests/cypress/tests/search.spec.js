/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad, tags } from '../config'
import { searchPage, searchBar } from '../views/search'

const clusterMode = {
  deployment: 'search-api',
  label: 'Local',
  namespace: 'open-cluster-management',
  skip: false,
  valueFn: () => cy.wrap('local-cluster'),
}

describe(`Search: Search in ${clusterMode.label} Cluster`, { tags: tags.env }, function () {
  before(function () {
    // Setting the cluster mode cluster as the current instance cluster.
    clusterMode.valueFn().as('clusterName')
  })

  beforeEach(function () {
    // Log into the cluster ACM console.
    cy.visitAndLogin('/multicloud/home/search')
  })

  context('UI - Search page validation', { tags: tags.modes }, function () {
    it(`[P1][Sev1][${squad}] should load and render the search page`, function () {
      searchPage.shouldLoad()
      searchPage.shouldRenderSavedSearchesTab()
      searchPage.shouldRenderSearchBar()
      searchPage.shouldRenderSuggestedSearches()
    })
  })

  context('Verify: search results with common filter and condition', { tags: tags.modes }, function () {
    beforeEach(function () {
      searchPage.shouldFindNamespaceInCluster(clusterMode.namespace, this.clusterName)
    })

    it(`[P2][Sev2][${squad}] should work kind filter for deployment`, function () {
      searchBar.whenFilterByKind('deployment')
      searchBar.whenRunSearchQuery()
      searchBar.whenUsePagination(50)
      searchPage.shouldFindResourceDetailItem('deployment', clusterMode.deployment, clusterMode.namespace)
    })

    it(`[P2][Sev2][${squad}] should work kind filter for pod`, function () {
      searchBar.whenFilterByKind('Pod')
      searchBar.whenRunSearchQuery()
      searchBar.whenUsePagination(50)
      searchPage.shouldFindResourceDetailItem('Pod', clusterMode.deployment, clusterMode.namespace)
    })

    it(`[P3][Sev3][${squad}] should have the expected relationships`, function () {
      searchBar.whenRunSearchQuery()
      searchPage.whenExpandRelationshipTiles()
      searchPage.shouldFindRelationshipTile('Cluster')
      searchPage.shouldFindRelationshipTile('Deployment')
      searchPage.shouldFindRelationshipTile('Pod')
    })
  })
})
