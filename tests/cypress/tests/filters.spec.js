/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { searchPage, searchBar, squad } from '../views/search'
import { filtersRegistry, multipleValues, combined, simple, useText } from '../scripts/filters'

// Filter Specification
// - type: the filter name
// - options:
//    - values: the values that the test will type for each filter
//    - strategies: the type of strategy to be performed for each filter
//
// Values Specification
// - useText(val, next): will type the `val` value in th search bar and then will type the `next` value if it exists.
// - useNextSuggestion(): will select the first suggestion
//
// Strategies Specification
// - simple(): it will check that the filter option is available and it shows suggestions
// - combined(list): it will check that the combination of the current filter with the filters provided in the `list` arguments works fine
// - multipleValues(count): it will check that the filter works fine when using multiple values at the same time

const nameFilter = filtersRegistry.createFilter('name')
const labelFilter = filtersRegistry.createFilter('label')
const kindFilter = filtersRegistry.createFilter('kind', { strategies: [ multipleValues(2), combined([nameFilter, labelFilter])] })
filtersRegistry.createFilter('role', { values: [useText('master'), useText('worker')], strategies: [ multipleValues(2) ] })
filtersRegistry.createFilter('status', { strategies: [ simple, multipleValues(2) ]} )


/* NOTE: Will move the API tests.  API test is faster and more reliable to test all filters.

filtersRegistry.createFilter('created')
filtersRegistry.createFilter('selfLink')
filtersRegistry.createFilter('apigroup')
filtersRegistry.createFilter('kubernetesVersion', { values: [useText('>', '0')] })
filtersRegistry.createFilter('desired', { values: [useText('=', '0')] })
filtersRegistry.createFilter('current', { values: [useText('=', '0')] })
filtersRegistry.createFilter('ready', { values: [useText('=', '0')] })
filtersRegistry.createFilter('available', { values: [useText('=', '0')] })
filtersRegistry.createFilter('restarts', { values: [useText('=', '0')] })
filtersRegistry.createFilter('numRules', { values: [useText('=', '0')] })
filtersRegistry.createFilter('parallelism', { values: [useText('=', '0')] })
filtersRegistry.createFilter('completions', { values: [useText('=', '0')] })
filtersRegistry.createFilter('successful', { values: [useText('=', '0')] })
filtersRegistry.createFilter('updated', { values: [useText('=', '0')] })
filtersRegistry.createFilter('cpu', { values: [useText('=', '0')] })
filtersRegistry.createFilter('active', { values: [useText('=', '0')] })
filtersRegistry.createFilter('nodes', { values: [useText('=', '0')] })
// filtersRegistry.createFilter('apiversion') // Failing on canary environment
// Container is failing when using one suggestion value, so running simple scenario only. Reported: https://github.com/open-cluster-management/backlog/issues/5958
filtersRegistry.createFilter('container', { values: [] })
filtersRegistry.createFilter('image')
filtersRegistry.createFilter('podIP')
filtersRegistry.createFilter('startedAt')
filtersRegistry.createFilter('hostIP')
// filtersRegistry.createFilter('remediationAction') // Failing on canary environment
filtersRegistry.createFilter('disabled', { values: [useText('false'), useText('true')] })
// filtersRegistry.createFilter('compliant') // Failing on canary environment
filtersRegistry.createFilter('package')
filtersRegistry.createFilter('channel')
filtersRegistry.createFilter('localPlacement')
filtersRegistry.createFilter('packageFilterVersion')
// Port is failing when using one suggestion value, so running simple scenario only. Reported: https://github.com/open-cluster-management/backlog/issues/5958
filtersRegistry.createFilter('port', { values: [] })
filtersRegistry.createFilter('type')
filtersRegistry.createFilter('clusterIP')
filtersRegistry.createFilter('pathname')
filtersRegistry.createFilter('timeWindow', { values: [useText('active'), useText('blocked')] })
filtersRegistry.createFilter('url')
filtersRegistry.createFilter('sourceType')
filtersRegistry.createFilter('capacity')
// filtersRegistry.createFilter('storageClassName') // Failing on canary environment
filtersRegistry.createFilter('volumeName')
// filtersRegistry.createFilter('request') // Failing on canary environment
// filtersRegistry.createFilter('accessMode') // Failing on canary environment
// filtersRegistry.createFilter('architecture') // Failing on canary environment
// osImage has no suggestions because values have blank spaces. Issue: https://github.com/open-cluster-management/backlog/issues/1715
// filtersRegistry.createFilter('osImage', { values: [] })
filtersRegistry.createFilter('claimRef')
filtersRegistry.createFilter('reclaimPolicy')
filtersRegistry.createFilter('lastSchedule')
// Schedule is failing when using one suggestion value, so running simple scenario only. Reported: https://github.com/open-cluster-management/backlog/issues/5960
filtersRegistry.createFilter('schedule', { values: [] })
// filtersRegistry.createFilter('suspend') // Failing on canary environment
filtersRegistry.createFilter('memory')
filtersRegistry.createFilter('ManagedClusterInfoSynced')
filtersRegistry.createFilter('ManagedClusterJoined')
filtersRegistry.createFilter('HubAcceptedManagedCluster')
filtersRegistry.createFilter('ManagedClusterConditionAvailable')
filtersRegistry.createFilter('consoleURL')
filtersRegistry.createFilter('app_instance', { values: [useText('any')] })
filtersRegistry.createFilter('cluster', { strategies: [ combined([kindFilter, nameFilter])] })
*/

describe('Search: Search using filters', function() {
  before(function() {
    cy.login()
    searchPage.whenGoToSearchPage()
  })
  
  filtersRegistry.filters.forEach((filter) =>   {
    if (filter.skip) {
      return;
    }

    describe(`[P1][Sev1][${squad}] Search using "${filter.type}" filter`, function() {

      beforeEach(function() {
        searchBar.whenClearFilters()
        searchBar.whenFocusSearchBar()
      })
  
      if (filter.strategies) {
        filter.strategies.forEach((runner) => runner(filter))
      }
    })
  })
  
  after(function() {
    cy.logout()
  })
})