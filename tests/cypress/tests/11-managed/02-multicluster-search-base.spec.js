/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />
import { squad, tags } from '../../config'
import { savedSearches } from '../../views/savedSearches'
import { searchPage } from '../../views/search'

const queryDefaultNamespaceName = 'default namespace search'
const queryDefaultNamespaceDesc =
  'this is searching that each cluster should have default namespace'

const queryOcmaNamespaceName = 'open-cluster-management-agent search'
const queryOcmaNamespaceDesc =
  'this is searching that each cluster should have open-cluster-management-agent'

describe(
  'RHACM4K-1262 - Search: multiple managedclusters base tests',
  { tags: tags.env },
  function () {
    beforeEach(function () {
      cy.visitAndLogin('/multicloud/home/welcome')
    })

    context(
      'verify: multicluster managed base',
      { tags: tags.modes },
      function () {
        beforeEach(function () {
          searchPage.whenGoToSearchPage()
        })

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

        it(`[P2][Sev2][${squad}] should be able to find the saved searches after logging back in`, function () {
          savedSearches.getSavedSearch(queryDefaultNamespaceName)
          savedSearches.getSavedSearch(queryOcmaNamespaceName)
        })
      }
    )
  }
)
