/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { popupModal } from '../views/popup'
import { getOpt } from '../scripts/utils'

const SEARCH_MESSAGES_INPUT_PLACE_HOLDER = 'Search items'
const SEARCH_MESSAGES_LOADING_RESULTS = 'Loading results'
const SEARCH_MESSAGES_NO_RESULTS = 'No search results found'
const SEARCH_MESSAGES_FEW_SECONDS_AGO = 'a few seconds ago'
const SEARCH_MESSAGES_LOADING_SUGGESTIONS = 'Loading...'

export const SQUAD = "search"

export const pageLoader = {
  shouldExist: () => cy.get('.content-spinner', { timeout: 20000 }).should('exist')  ,
  shouldNotExist: () => cy.get('.content-spinner', { timeout: 20000 }).should('not.exist')
}

export const searchPage = {
  whenGoToWelcomePage:() => cy.visit('/multicloud/welcome'), // WORKAROUND for https://github.com/open-cluster-management/backlog/issues/5725
  whenGoToSearchPage:() => cy.visit('/multicloud/search'),
  whenExpandQuickFilters:() => {
    cy.get('.show-more-results-button > button', { timeout: 20000 }).focus().click()
  },
  whenGetResourceDetailItem:(resource, name) => {
    return cy.contains('.search--resource-table-header-button', resource, {timeout: 6000})
             .parentsUntil('.search--resource-table', {timeout: 20000})
             .find('table.bx--data-table-v2 tbody tr', {timeout: 20000}).contains('td', name)
             .parent();
  },
  whenDeleteResourceDetailItem:(resource, name) => {
    searchPage.whenGetResourceDetailItem(resource, name).find('td .bx--overflow-menu__icon', {timeout: 2000}).click({ force: true })
    cy.get('.bx--overflow-menu-options button[data-table-action="table.actions.remove"]', {timeout: 2000}).click({ timeout: 10000 }).wait(1000)
    popupModal.whenAccept()
  },
  whenGoToResourceDetailItemPage: (resource, name) => {
    pageLoader.shouldNotExist()
    searchPage.whenGetResourceDetailItem(resource, name).find('td').eq(0).find('a').click()
  },
  whenDeleteNamespace: (namespace, options) => {
    var ignoreIfDoesNotExist = getOpt(options, 'ignoreIfDoesNotExist', true)
    var deleteFn = () => searchPage.whenDeleteResourceDetailItem('namespace', namespace)

    searchPage.whenGoToSearchPage()
    searchBar.whenFilterByKind('namespace')
    searchBar.whenFilterByName(namespace)
    searchPage.shouldLoadResults()
    if (ignoreIfDoesNotExist == true) {
      cy.ifNotContains('.page-content-container', SEARCH_MESSAGES_NO_RESULTS, deleteFn)
    } else {
      deleteFn()
    }
  },
  whenWaitUntilFindResults:(options) => {
    cy.reloadUntil(() => {
      searchPage.shouldLoadResults()
      return cy.ifNotContains('.page-content-container', SEARCH_MESSAGES_NO_RESULTS)
    }, options)
  },
  shouldPageBeReady:() => cy.waitUntilAttrIs('.react-tags__search-input input', 'placeholder', SEARCH_MESSAGES_INPUT_PLACE_HOLDER),
  shouldLoadResults:() => cy.waitUntilNotContains('.search--results-view > h4', SEARCH_MESSAGES_LOADING_RESULTS, { timeout: 60000, interval: 1000 }),
  shouldExist:() => {
    cy.get('.bx--detail-page-header-title', {timeout: 20000}).should('exist')
    cy.get('.react-tags__search-input input', {timeout: 20000}).should('exist')
    cy.get('.saved-search-query-header', { timeout: 20000}).should('exist')
  },
  shouldFindNoResults:(options) => {
    cy.reloadUntil(() => {
      searchPage.shouldLoadResults()
      return cy.ifContains('.page-content-container', SEARCH_MESSAGES_NO_RESULTS)
    }, options)
  },
  shouldValidateSearchQuery:() => {
    searchPage.shouldLoadResults()
    cy.get('.bx--inline-notification__details').should('not.exist')
  },
  shouldFindQuickFilter: (resource, count) => {
    cy.reloadUntil(() => {
      searchPage.shouldLoadResults()
      return cy.ifContains('[for="related-resource-' + resource + '"] > .bx--tile-content', count)
    })
  },
  shouldFindResourceDetail: (resource) => {
    cy.contains('.search--resource-table-header-button', resource, {timeout: 6000})
  },
  shouldFindAnyResourceDetail: () => {
    cy.get('.search--resource-table-header-button', {timeout: 6000 }).should('exist')
  },
  shouldFindResourceDetailItem: (resource, name) => {
    searchPage.whenGetResourceDetailItem(resource, name).should('exist')
  },
  shouldBeResourceDetailItemCreatedFewSecondsAgo: (resource, name) => {
    cy.reloadUntil(() => {
      searchPage.shouldLoadResults()
      return cy.ifContains('.search--resource-table', SEARCH_MESSAGES_FEW_SECONDS_AGO)
    })
  }
}

export const searchBar = {
  whenFocusSearchBar:() => {
    cy.get('.react-tags', {timeout: 20000}).click()
  },
  whenClearFilters:() => {
    cy.forEach('.react-tags__selected button', ($elem) => $elem.click(), { failIfNotFound: false })
  },
  whenEnterTextInSearchBar:(property, value) => {
    cy.get('.react-tags__search-input input', {timeout: 20000}).should('exist').focus().click().type(property).wait(200)
    cy.get('.react-tags', {timeout: 20000}).should('exist')
    cy.get('.react-tags__search-input', {timeout: 20000}).should('exist')
    cy.get('.react-tags__search-input input', {timeout: 20000}).type(' ').wait(200)
    if (value && value !== null) {
      cy.get('.react-tags__search-input input', {timeout: 20000}).type(value)
      cy.get('.react-tags__search-input input', {timeout: 20000}).type(' ').wait(200)
    }
  },
  whenFilterByCluster:(cluster) => {
    searchBar.whenEnterTextInSearchBar('cluster', cluster)
  },
  whenFilterByClusterAndNamespace:(cluster, namespace) => {
    searchBar.whenFilterByCluster(cluster)
    searchBar.whenEnterTextInSearchBar('namespace', namespace)
  },
  whenFilterByKind:(kind) => {
    searchBar.whenEnterTextInSearchBar('kind', kind)
  },
  whenFilterByName:(name) => {
    searchBar.whenEnterTextInSearchBar('name', name)
  },
  whenSelectFirstSuggestedValue:() => {
    searchBar.shouldSuggestValues()

    cy.get('.react-tags__suggestions li[role="option"]', { timeout: 10000 }).eq(1).click()
  },
  shouldSuggestValues:() => {
    cy.waitUntilNotContains('.react-tags__suggestions', SEARCH_MESSAGES_LOADING_SUGGESTIONS, { timeout: 60000, interval: 1000 })
  }
}


export const suggestedTemplate = {
  whenSelectCreatesLastHour:() => {
    cy.get('.suggested-search-queries').children('.query-cards-container').children().eq(2).click()
    cy.get('.react-tags__selected-tag-name').should('contain', 'created:hour')
  },
  whenSelectWorkloads:() => {
    cy.get('.suggested-search-queries').children('.query-cards-container').children().eq(0).click()
    cy.get('.react-tags__selected-tag-name').should('contain', 'kind:daemonset,deployment,job,statefulset,replicaset')
  },
  whenSelectUnhealthyPods:() => {
    cy.get('.suggested-search-queries').children('.query-cards-container').children().eq(1).click()
    cy.get('.react-tags__selected-tag-name').should('contain', 'kind:pod')
    cy.get('.react-tags__selected-tag-name').should('contain','status:Pending,Error,Failed,Terminating,ImagePullBackOff,CrashLoopBackOff,RunContainerError,ContainerCreating')
  },
  whenGetRelatedItemDetails:(resource) => {
    return cy.contains('.search--resource-table', resource, {timeout: 20000})
             .find('table.bx--data-table-v2 tbody tr', {timeout: 20000})
             .parent();
  },
  whenVerifyRelatedItemsDetails:() => {
    cy.waitUsingSLA()
    cy.get('.page-content-container > :nth-child(2)').then(($span) => {
    if (($span.text()) !== 'No search results found.')
    {
      cy.contains('Show all').click()
      cy.get('.bx--tile-content > :nth-child(1) > .content > .text').each(($el) => {
          const itemName = $el.text()
          cy.wrap($el).click()
       suggestedTemplate.whenGetRelatedItemDetails(itemName).should('exist', {timeout: 20000} )
       cy.wrap($el).click()
      })
    }
   })
  }
}