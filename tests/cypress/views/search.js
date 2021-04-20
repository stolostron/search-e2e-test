/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { popupModal } from './popup'
import { getOpt } from '../scripts/utils'

const SEARCH_MESSAGES_INPUT_PLACE_HOLDER = 'Search items'
const SEARCH_MESSAGES_NO_RESULTS = 'No results found for the current search criteria.'
const SEARCH_MESSAGES_FEW_SECONDS_AGO = 'a few seconds ago'
const SEARCH_MESSAGES_LOADING_SUGGESTIONS = 'Loading...'

export const searchPage = {
  whenGoToSearchPage:() => cy.visit('/search'),
  
  whenExpandRelationshipTiles:() => {
    cy.get('.pf-c-skeleton', {timeout: 2000}).should('not.exist')
    cy.get('.pf-l-gallery', {timeout: 2000}).children().should('have.length.above', 1).then(() => {
      cy.get('button.pf-c-button.pf-m-secondary').focus().click()
    })
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
    searchPage.whenGetResourceTableRow(resource, name).find('td').eq(0).find('a').click({force: true})
  },
  whenDeleteNamespace: (namespace, options) => {
    var ignoreIfDoesNotExist = getOpt(options, 'ignoreIfDoesNotExist', true)
    var deleteFn = () => searchPage.whenDeleteResourceDetailItem('namespace', namespace)

    searchPage.whenGoToSearchPage()
    searchBar.whenFilterByKind('namespace')
    searchBar.whenFilterByName(namespace)
    searchPage.shouldLoadResults()
    if (ignoreIfDoesNotExist == true) {
      cy.ifNotContains('.pf-c-alert__title', SEARCH_MESSAGES_NO_RESULTS, deleteFn)
    } else {
      deleteFn()
    }
  },

  shouldPageBeReady:() => cy.waitUntilAttrIs('.react-tags__search-input', 'placeholder', SEARCH_MESSAGES_INPUT_PLACE_HOLDER),
  shouldCollapseResourceTables: () => {
    cy.get('.pf-c-expandable-section__toggle-text').click({ multiple: true })
  },
  whenReloadUntilFindResults: (options) => {
    cy.reloadUntil(async() => {
      cy.get('.pf-c-table')
    }, options)
  },
 
  shouldLoadResults:() => cy.get('.pf-c-spinner').should('not.exist'),

  shouldLoad:() => {
    cy.get('.pf-c-page').should('contain', 'Search')
  },

  shouldFindNoResults: () => {
    cy.get('.pf-c-alert__title').should('contain', SEARCH_MESSAGES_NO_RESULTS)
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
    cy.get('.search--resource-table-header-button', {timeout: 6000 })
  },
  shouldFindResourceDetailItem: (resource, name) => {
    searchPage.whenGetResourceTableRow(resource, name)
  },
  shouldBeResourceDetailItemCreatedFewSecondsAgo: (resource, name) => {
    cy.reloadUntil(() => {
      cy.wait(500)
      searchPage.shouldLoadResults()
      return cy.ifContains('td', SEARCH_MESSAGES_FEW_SECONDS_AGO)
    })
  },
  shouldHaveCorrectNumberOfRunningPodsInNSByCluster: (count, ns, clusterName) => {
    searchBar.whenClearFilters()
    searchBar.whenEnterTextInSearchBar('kind', 'pod')
    searchBar.whenEnterTextInSearchBar('namespace', ns)
    searchBar.whenEnterTextInSearchBar('status', 'Running')
    searchBar.whenEnterTextInSearchBar('cluster', clusterName)
    cy.get('.pf-c-expandable-section__toggle').contains(`Pod (${count})`)
  },
  shouldFindApplicationInNS: (appName, ns) => {
    searchBar.whenClearFilters()
    searchBar.whenEnterTextInSearchBar('namespace', ns)
    searchBar.whenEnterTextInSearchBar('kind', 'application')
    searchBar.whenEnterTextInSearchBar('name', appName)
    searchPage.shouldLoadResults()
  },
  shouldDeleteApplicationInNS: (appName, ns) => {
    searchPage.whenDeleteResourceDetailItem('application', appName)
    searchPage.shouldFindNoResults()
  }
}


export const searchBar = {
  whenFocusSearchBar:() => {
    cy.get('.react-tags').click()
  },
  whenClearFilters:() => {
    cy.get('#clear-all-search-tags-button').click({force: true})
  },
  whenSuggestionsAreAvailable: (value, ignoreIfDoesNotExist=false) => {
    if(!ignoreIfDoesNotExist) {
      cy.get('.react-tags__suggestions ul#ReactTags').children().should('have.length.above', 1)
    }
    cy.get('.react-tags__search-input').click().type(value)
  },
  whenEnterTextInSearchBar:(property, value, ignoreIfDoesNotExist=false) => {
    cy.get('.react-tags__search-input').click()
    searchBar.whenSuggestionsAreAvailable(property, ignoreIfDoesNotExist)

    cy.get('.react-tags__search-input').type(' ')

    if (value && value !== null) {
      searchBar.whenSuggestionsAreAvailable(value, ignoreIfDoesNotExist)
      cy.get('.react-tags__search-input').type(' ')
    }
  },
  whenFilterByCluster:(cluster) => {
    searchBar.whenEnterTextInSearchBar('cluster', cluster)
  },
  whenFilterByClusterAndNamespace:(cluster, namespace) => {
    searchBar.whenFilterByCluster(cluster)
    searchBar.whenEnterTextInSearchBar('namespace', namespace)
  },
  whenFilterByKind:(kind, ignoreIfDoesNotExist=false) => {
    searchBar.whenEnterTextInSearchBar('kind', kind, ignoreIfDoesNotExist)
  },
  whenFilterByName:(name, ignoreIfDoesNotExist=false) => {
    searchBar.whenEnterTextInSearchBar('name', name, ignoreIfDoesNotExist)
  },
  whenFilterByNameSpace:(namespace, ignoreIfDoesNotExist=false) => {
    searchBar.whenEnterTextInSearchBar('namespace', namespace, ignoreIfDoesNotExist)
  },
  whenSelectFirstSuggestedValue:() => {
    searchBar.shouldSuggestValues()
    cy.get('.react-tags__suggestions li[role="option"]').eq(1).click()
  },
  shouldSuggestValues:() => {
    cy.waitUntilNotContains('.react-tags__suggestions', SEARCH_MESSAGES_LOADING_SUGGESTIONS, { timeout: 60000, interval: 1000 })
  }
}
