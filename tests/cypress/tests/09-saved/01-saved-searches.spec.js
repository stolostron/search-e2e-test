/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />
import { savedSearches } from '../../views/savedSearches'
import { squad } from '../../config'

const queryDefaultNamespaceName = 'default namespace search'
const queryDefaultNamespaceDesc =
  'this is searching that each cluster should have default namespace'

const queryOcmaNamespaceName = 'open-cluster-management-agent search'
const queryOcmaNamespaceDesc =
  'this is searching that each cluster should have open-cluster-management-agent'

const queryOCMaEditedName = `[E2E] default namespace search - ${Date.now()}`
const queryOcmaEditedDesc =
  '[Created by Search E2E automation] This is searching that each cluster should have default namespace -2'

describe('RHACM4K-1262 - Search: multiple managedclusters base tests', function () {
  context('prereq: user should log into the ACM console', function () {
    it(`[P1][Sev1][${squad}] should login`, function () {
      cy.login()
    })
  })

  context('verify: saved searches function', function () {
    it(`[P2][Sev2][${squad}] should find each managed cluster has default namespace`, function () {
      savedSearches.validateClusterNamespace({ namespace: 'default' }, '')
    })

    it(`[P2][Sev2][${squad}] should find open-cluster-management-agent namespace exists`, function () {
      savedSearches.validateClusterNamespace(
        { kind: 'namespace', name: 'open-cluster-management-agent' },
        'has_local-cluster'
      )
    })

    it(`[P2][Sev2][${squad}] should be able to save current search`, function () {
      savedSearches.saveClusterNamespaceSearch(
        { namespace: 'default' },
        queryDefaultNamespaceName,
        queryDefaultNamespaceDesc
      )
      savedSearches.saveClusterNamespaceSearch(
        { kind: 'namespace', name: 'open-cluster-management-agent' },
        queryOcmaNamespaceName,
        queryOcmaNamespaceDesc
      )
    })

    it(`[P2][Sev2][${squad}] should be able to find the saved searches`, function () {
      savedSearches.getSavedSearch(queryDefaultNamespaceName)
      savedSearches.getSavedSearch(queryOcmaNamespaceName)
    })

    it(`[P2][Sev2][${squad}] should logout`, function () {
      cy.logout()
    })

    it(`[P2][Sev2][${squad}] should login`, function () {
      cy.login()
    })

    it(`[P2][Sev2][${squad}] should be able to find the saved searches after logging back in`, function () {
      savedSearches.getSavedSearch(queryDefaultNamespaceName)
      savedSearches.getSavedSearch(queryOcmaNamespaceName)
    })
  })
})

describe('RHACM4K-412 - Search: Saved searches', function () {
  context('verify: saved searches resource actions', function () {
    it(`[P2][Sev2][${squad}] should be able to edit the saved searches`, function () {
      savedSearches.editSavedSearch(
        queryDefaultNamespaceName,
        queryOCMaEditedName,
        queryOcmaEditedDesc
      )
    })

    it(`[P2][Sev2][${squad}] should be able to find the saved searches`, function () {
      savedSearches.getSavedSearch(queryOCMaEditedName)
      savedSearches.getSavedSearch(queryOcmaNamespaceName)
    })

    it(`[P2][Sev2][${squad}] should be able to revert back the edited saved searches`, function () {
      savedSearches.editSavedSearch(
        queryOCMaEditedName,
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

    it(`[P2][Sev2][${squad}] should be able to delete the saved search ${queryOcmaNamespaceName}`, function () {
      savedSearches.whenDeleteSavedSearch(queryOcmaNamespaceName)
    })
  })
})
