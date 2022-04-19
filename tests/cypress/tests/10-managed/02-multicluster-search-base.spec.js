/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad, tags } from '../../config'
import { cliHelper } from '../../scripts/cliHelper'
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
    before(function () {
      cliHelper.getTargetManagedCluster().as('clusterName')
    })

    beforeEach(function () {
      // Log into the cluster ACM console.
      cy.visitAndLogin('/multicloud/home/welcome')
      searchPage.whenGoToSearchPage()
    })

    context(
      'verify: multicluster managed base',
      { tags: tags.modes },
      function () {
        it(`[P2][Sev2][${squad}] should find each managed cluster has default namespace`, function () {
          savedSearches.validateClusterNamespace({
            kind: 'namespace',
            name: 'default',
          })
        })

        it(`[P2][Sev2][${squad}] should find open-cluster-management-agent namespace exists`, function () {
          savedSearches.validateClusterNamespace({
            kind: 'namespace',
            name: 'open-cluster-management-agent',
          })
        })

        it(`[P2][Sev2][${squad}] should be able to save current search`, function () {
          savedSearches.saveClusterNamespaceSearch(
            this.clusterName,
            'default',
            queryDefaultNamespaceName,
            queryDefaultNamespaceDesc
          )
          savedSearches.saveClusterNamespaceSearch(
            this.clusterName,
            'open-cluster-management-agent',
            queryOcmaNamespaceName,
            queryOcmaNamespaceDesc
          )
        })

        it(`[P2][Sev2][${squad}] should be able to find the default saved searches`, function () {
          savedSearches.getSavedSearch(queryDefaultNamespaceName)
        })

        it(`[P2][Sev2][${squad}] should be able to find the ocm-agent saved searches`, function () {
          savedSearches.getSavedSearch(queryOcmaNamespaceName)
        })

        it(`[P2][Sev2][${squad}] should logout`, function () {
          cy.logout()
        })

        it(`[P2][Sev2][${squad}] should be able to find the default saved searches after logging back in`, function () {
          savedSearches.getSavedSearch(queryDefaultNamespaceName)
        })

        it(`[P2][Sev2][${squad}] should be able to find the ocm-agent saved searches after logging back in`, function () {
          savedSearches.getSavedSearch(queryOcmaNamespaceName)
        })
      }
    )
  }
)
