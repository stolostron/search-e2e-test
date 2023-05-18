/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad, tags } from '../config'
import { searchBar } from '../views/search'
import { suggestedSearches } from '../views/suggestedSearches'

describe('RHACM4K-411: Verify the suggested search templates', { tags: tags.env }, function () {
  beforeEach(function () {
    // Log into the cluster ACM console.
    cy.visitAndLogin('/multicloud/home/search')
  })

  context('Console-Search suggested searches', { tags: tags.modes }, function () {
    it(`[P3][Sev3][${squad}] should see the workloads template & search tag in search items`, function () {
      suggestedSearches.whenSelectCardWithTitle('Workloads')
      searchBar.shouldContainTag('kind:DaemonSet,Deployment,Job,StatefulSet,ReplicaSet')
    })

    it(`[P3][Sev3][${squad}] should see the unhealthy pods template & search tag in search items`, function () {
      suggestedSearches.whenSelectCardWithTitle('Unhealthy pods')
      searchBar.shouldContainTag('kind:Pod')
      searchBar.shouldContainTag(
        'status:Pending,Error,Failed,Terminating,ImagePullBackOff,CrashLoopBackOff,RunContainerError,ContainerCreating'
      )
    })

    it(`[P3][Sev3][${squad}] should see the created last hour template & search tag in search items`, function () {
      suggestedSearches.whenSelectCardWithTitle('Created last hour')
      searchBar.shouldContainTag('created:hour')
    })
  })
})
