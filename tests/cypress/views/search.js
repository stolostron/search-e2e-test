/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { popupModal } from './popup'
import { getOpt } from '../scripts/utils'

const SEARCH_MESSAGES_INPUT_PLACE_HOLDER = 'Search items'
const SEARCH_MESSAGES_LOADING_RESULTS = 'Loading results'
const SEARCH_MESSAGES_NO_RESULTS = 'No results found for the current search criteria.'
const SEARCH_MESSAGES_FEW_SECONDS_AGO = 'a few seconds ago'
const SEARCH_MESSAGES_LOADING_SUGGESTIONS = 'Loading...'


export const searchPage = {
  whenGoToSearchPage:() => cy.visit('/search'),
  
  whenExpandRelationshipTiles:() => {
    // cy.get('.pf-c-page__main-section > div > pf-c-button', { timeout: 20000 }).focus().click()
    cy.get('button.pf-c-button.pf-m-secondary', { timeout: 20000 }).focus().click()
  },
  whenGetResourceTableRow:(resource, name) => {
    return cy.get('tr').filter(`:contains("${name}")`)
  },
  whenDeleteResourceDetailItem:(resource, name) => {
    searchPage.whenGetResourceTableRow(resource, name).find('.pf-c-dropdown__toggle', {timeout: 2000}).click({ force: true })
    cy.get('button.pf-c-dropdown__menu-item', {timeout: 2000}).should('contain', `Delete ${resource}`).click({ timeout: 10000 }).wait(1000)
    popupModal.whenAccept()
  },
  whenGoToResourceDetailItemPage: (resource, name) => {
    // pageLoader.shouldNotExist()
    searchPage.whenGetResourceTableRow(resource, name).find('td').eq(0).find('a').click()
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

  shouldPageBeReady:() => cy.waitUntilAttrIs('.react-tags__search-input', 'placeholder', SEARCH_MESSAGES_INPUT_PLACE_HOLDER),

  whenReloadUntilFindResults: (options) => {
    cy.reloadUntil(async() => {
      // searchPage.shouldLoadResults()
      cy.get('.pf-c-table', { timeout: 30000 }).should('exist')
      // cy.get('.pf-c-spinner', { timeout: 30000 }).should('not.exist')
    }, options)
  },
 
  // shouldLoadResults:() => cy.waitUntilNotContains('.pf-c-spinner', { timeout: 60000, interval: 1000 }).should('not.exist'),
  shouldLoadResults:() => cy.get('.pf-c-spinner', { timeout: 30000 }).should('not.exist'),

  shouldLoad:() => {
    cy.get('.react-tags', {timeout: 20000}).should('exist')
    cy.get('.react-tags__search-input', {timeout: 20000}).should('exist')
    // cy.get('.saved-search-query-header', { timeout: 20000}).should('exist')
  },

  shouldFindNoResults: () => {
    cy.get('.pf-c-alert__title', { timeout: 30000 }).should('contain', SEARCH_MESSAGES_NO_RESULTS)
  },
  shouldValidateSearchQuery:() => {
    searchPage.shouldLoadResults()
    cy.get('.pf-c-alert pf-m-inline pf-m-danger').should('not.exist')
  },
  
  shouldFindRelationshipTile: (resource, count) => {
    cy.get('.pf-c-page__main-section').should('contain', `${count}`)
    cy.get('.pf-c-page__main-section').should('contain', `Related ${resource}`)
  },

  shouldFindResourceDetail: (resource) => {
    cy.contains('.search--resource-table-header-button', resource, {timeout: 6000})
  },
  shouldFindAnyResourceDetail: () => {
    cy.get('.search--resource-table-header-button', {timeout: 6000 }).should('exist')
  },
  shouldFindResourceDetailItem: (resource, name) => {
    searchPage.whenGetResourceTableRow(resource, name).should('exist')
  },
  shouldBeResourceDetailItemCreatedFewSecondsAgo: (resource, name) => {
    cy.reloadUntil(() => {
      searchPage.shouldLoadResults()
      return cy.ifContains('td', SEARCH_MESSAGES_FEW_SECONDS_AGO)
    })
  }
}


export const searchBar = {
  whenFocusSearchBar:() => {
    cy.get('.react-tags', {timeout: 20000}).click()
  },
  whenClearFilters:() => {
    cy.get('#clear-all-search-tags-button').click()
  },
  whenEnterTextInSearchBar:(property, value) => {
    cy.get('.react-tags__search-input', {timeout: 20000}).should('exist').focus().click().type(property).wait(200)
    cy.get('.react-tags', {timeout: 20000}).should('exist')
    cy.get('.react-tags__search-input', {timeout: 20000}).should('exist')
    cy.get('.react-tags__search-input', {timeout: 20000}).type(' ').wait(200)
    if (value && value !== null) {
      cy.get('.react-tags__search-input', {timeout: 20000}).type(value)
      cy.get('.react-tags__search-input', {timeout: 20000}).type(' ').wait(200)
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
