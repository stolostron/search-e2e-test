/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

import { squad, tags } from '../config'
import { podDetailPage } from '../views/podDetailPage'
import { searchBar, searchPage } from '../views/search'

const clusterMode = {
  deployment: 'search-api',
  label: 'Local',
  namespace: Cypress.env('ACM_NAMESPACE'),
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

  context('Console-Search detail pages for yaml and logs', { tags: tags.modes }, function () {
    beforeEach(function () {
      searchPage.shouldFindNamespaceInCluster(clusterMode.namespace, this.clusterName)
    })

    it(`[P2][Sev2][${squad}] should see pod logs`, function () {
      searchBar.whenFilterByKind('Pod')
      searchBar.whenRunSearchQuery()
      searchBar.whenUsePagination(50)
      searchPage.whenGoToResourceDetailItemPage('Pod', clusterMode.deployment, clusterMode.namespace)
      podDetailPage.whenClickOnLogsTab()
    })

    // TODO: Re-enable within a smaller PR.
    // it(`[P3][Sev3][${squad}] should edit yaml and scale deployment`, function () {
    //   searchBar.whenFilterByKind('deployment')
    //   searchPage.whenGoToResourceDetailItemPage(
    //     resources[1].kind,
    //     resources[1].name,
    //     resources[1].namespace
    //   )
    //   deploymentDetailPage.whenScaleReplicasTo(2)
    // })

    // it(`[P3][Sev3][${squad}] should verify that the deployment scaled`, function () {
    //   searchBar.whenFilterByKind('deployment')
    //   searchPage.shouldFindResourceDetailItem(
    //     resources[1].kind,
    //     resources[1].name,
    //     resources[1].namespace
    //   )
    //   searchPage.whenExpandRelationshipTiles()
    //   searchPage.shouldFindRelationshipTile('pod', 2)
    // })
  })
})
