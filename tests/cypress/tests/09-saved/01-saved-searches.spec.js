/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />
import { savedSearches } from '../../views/savedSearches'
import { squad, tags } from '../../config'
import { cliHelper } from '../../scripts/cliHelper'
import { searchBar, searchPage } from '../../views/search'

const postfix = Date.now()
const namespace = `auto-test-app-${postfix}`

const queryDefaultNamespaceName = `${namespace}-ns-search`
const queryDefaultNamespaceDesc = `This is searching that the cluster should have ${namespace} namespace.`

const queryEditNamespaceName = `[E2E] ${queryDefaultNamespaceName}-2`
const queryEditNamespaceDesc = `[Created by Search E2E automation] This is searching that the cluster should have ${namespace} namespace.-2`

describe('RHACM4K-412 - Search: Saved searches', { tags: tags.environments }, function () {
  context('prereq: user should log into the ACM console', { tags: tags.required }, function () {
    it(`[P1][Sev1][${squad}] should create namespace`, function () {
      cliHelper.createNamespace(namespace)
    })

    it(`[P1][Sev1][${squad}] should login`, function () {
      cy.login()
    })
  })

  context('verify: saved searches resource actions', { tags: ['@BVT'] },  function () {
    beforeEach(function () {
      searchPage.whenGoToSearchPage()
    })

    after(function () {
      cliHelper.deleteNamespace(namespace)
    })

    it(`[P2][Sev2][${squad}] should verify that the namespace is available`, function () {
      searchBar.whenFilterByNamespace(namespace)
      searchPage.shouldLoadResults()
    })

    it(`[P2][Sev2][${squad}] should be able to save current search`, function () {
      savedSearches.saveClusterNamespaceSearch({ namespace }, queryDefaultNamespaceName, queryDefaultNamespaceDesc
      )
    })

    it(`[P2][Sev2][${squad}] should be able to find the saved search`, function () {
      savedSearches.getSavedSearch(queryDefaultNamespaceName)
    })

    it(`[P2][Sev2][${squad}] should be able to edit the saved searches`, function () {
      savedSearches.editSavedSearch(namespace, queryEditNamespaceName, queryEditNamespaceDesc
      )
    })

    it(`[P2][Sev2][${squad}] should be able to revert back the edited saved searches`, function () {
      savedSearches.editSavedSearch(
        queryEditNamespaceName,
        queryDefaultNamespaceName,
        queryDefaultNamespaceDesc
      )
    })

    it(`[P2][Sev2][${squad}] should be able to share the saved searches`, function () {
      savedSearches.shareSavedSearch(queryDefaultNamespaceName)
    })

    it(`[P2][Sev2][${squad}] should be able to delete the saved searches ${queryDefaultNamespaceName}`, function () {
      savedSearches.whenDeleteSavedSearch(queryDefaultNamespaceName)
    })
  })
})
