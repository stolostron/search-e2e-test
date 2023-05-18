/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad, tags } from '../config'
import { savedSearches } from '../views/savedSearches'
import { searchBar, searchPage } from '../views/search'

const namespace = 'open-cluster-management'

const queryDefaultNamespaceName = `${namespace}-default`
const queryDefaultNamespaceDesc = `This is searching that the cluster should have ${namespace} namespace.`

const queryEditNamespaceName = `[E2E] ${namespace}-edit`
const queryEditNamespaceDesc = `[Created by Search E2E automation] This is searching that the cluster should have ${namespace} namespace.`

describe('RHACM4K-412 - Saved searches', { tags: tags.env }, function () {
  beforeEach(function () {
    // Log into the cluster ACM console.
    cy.visitAndLogin('/multicloud/home/search')
  })

  context('Console-Search saved searches', { tags: tags.modes }, function () {
    it(`[P3][Sev3][${squad}] should verify that the namespace is available`, function () {
      searchBar.whenFilterByNamespace(namespace)
      searchBar.whenRunSearchQuery()
      searchPage.shouldLoadResults()
    })

    it(`[P3][Sev3][${squad}] should save current search`, function () {
      savedSearches.saveClusterNamespaceSearch(
        'local-cluster',
        namespace,
        queryDefaultNamespaceName,
        queryDefaultNamespaceDesc
      )
    })

    it(`[P3][Sev3][${squad}] should find the saved search`, function () {
      savedSearches.getSavedSearch(queryDefaultNamespaceName)
    })

    it(`[P3][Sev3][${squad}] should edit the saved searches`, function () {
      savedSearches.editSavedSearch(namespace, queryEditNamespaceName, queryEditNamespaceDesc)
    })

    it(`[P3][Sev3][${squad}] should revert back the edited saved searches`, function () {
      savedSearches.editSavedSearch(queryEditNamespaceName, queryDefaultNamespaceName, queryDefaultNamespaceDesc)
    })

    it(`[P3][Sev3][${squad}] should share the saved searches`, function () {
      savedSearches.shareSavedSearch(queryDefaultNamespaceName)
    })

    it(`[P3][Sev3][${squad}] should delete the saved searches ${queryDefaultNamespaceName}`, function () {
      savedSearches.whenDeleteSavedSearch(queryDefaultNamespaceName)
    })
  })
})
