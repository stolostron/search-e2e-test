/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { squad, tags } from '../config'
import { searchBar } from '../views/search'
import { suggestedSearches } from '../views/suggestedSearches'

describe(
  'RHACM4K-411: Search: Verify the suggested search templates',
  { tags: tags.env },
  function () {
    beforeEach(function () {
      // Log into the cluster ACM console.
      cy.visitAndLogin('/multicloud/home/search')
    })

    context(
      'verify: search page suggested search queries',
      { tags: tags.modes },
      function () {
        it(`[P3][Sev3][${squad}] should see the workloads template & search tag in search items`, function () {
          suggestedSearches.whenSelectCardWithTitle('Workloads')
          searchBar.shouldContainTag(
            'kind:daemonset,deployment,job,statefulset,replicaset'
          )
          suggestedSearches.whenVerifyRelatedItemsDetails()
        })

        it(`[P3][Sev3][${squad}] should see the unhealthy pods template & search tag in search items`, function () {
          suggestedSearches.whenSelectCardWithTitle('Unhealthy pods')
          searchBar.shouldContainTag('kind:pod')
          searchBar.shouldContainTag(
            'status:Pending,Error,Failed,Terminating,ImagePullBackOff,CrashLoopBackOff,RunContainerError,ContainerCreating'
          )
          suggestedSearches.whenVerifyRelatedItemsDetails()
        })

        it(`[P3][Sev3][${squad}] should see the created last hour template & search tag in search items`, function () {
          suggestedSearches.whenSelectCardWithTitle('Created last hour')
          searchBar.shouldContainTag('created:hour')
          suggestedSearches.whenVerifyRelatedItemsDetails()
        })
      }
    )
  }
)
