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
  whenGoToWelcomePage:() => cy.visit('/multicloud/welcome'),
  whenExpandRelationshipTiles:() => {
    cy.get('.pf-c-skeleton', {timeout: 2000}).should('not.exist')
    cy.get('.pf-l-gallery', {timeout: 2000}).children().should('have.length.above', 1).then(() => {
      cy.get('button.pf-c-button.pf-m-secondary').focus().click()
    })
  },
  whenGetResourceTableRow:(resource, name) => {
    return cy.get('tr').filter(`:contains("${name}")`)
  },
  whenCreateResourceObject:() => {
    cy.get(`[aria-label="create-button"]`).click()
  },
  whenDeleteResourceDetailItem:(resource, name) => {
    searchPage.whenGetResourceTableRow(resource, name).find('.pf-c-dropdown__toggle', {timeout: 2000}).click({ force: true })
    cy.get('button.pf-c-dropdown__menu-item', {timeout: 2000}).should('contain', `Delete ${resource}`).click().wait(1000)
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

  whenReloadUntilFindResults: (options) => {
    cy.reloadUntil(async() => {
      cy.get('.pf-c-table', { timeout: 30000 })
    }, options)
  },
 
  shouldLoadResults:() => cy.get('.pf-c-spinner', { timeout: 30000 }).should('not.exist'),

  shouldLoad:() => {
    cy.get('.react-tags')
    cy.get('.react-tags__search-input')
    cy.get('div.pc-f-skeleton').should('not.exist')
  },
  whenToClickHelpIcon: () => {
    cy.get('[data-test="about-dropdown"]').click()
  },
  whenToClickTabInHelpIcon: (tab) => {
    cy.get('.pf-c-app-launcher__menu.pf-m-align-right')

    if (tab === 'About') {
      cy.get('button.pf-c-app-launcher__menu-item').should('contain', tab).click()
      cy.get('.pf-c-about-modal-box')

      cy.get('.pf-c-about-modal-box__body')
      cy.get('.pf-c-spinner.pf-m-md').should('not.exist')

      cy.get('.version-details__no').invoke('text').then(() => {
        cy.get('.version-details__no').should('contain', Cypress.env('ACM_VERSION'))
      })

      cy.get('.pf-c-about-modal-box__close')
      cy.get(`[aria-label="Close Dialog"]`).click()

    } else {
      cy.get('li a.pf-c-app-launcher__menu-item').should('contain', tab).and('have.attr', 'href').should('contain', 'documentation')
    }
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
  whenSuggestionsAreAvailable: (value, ignoreIfDoesNotExist) => {
    if(!ignoreIfDoesNotExist) {
      cy.get('.react-tags__suggestions ul#ReactTags').children().should('have.length.above', 1)
    }
    cy.get('.react-tags__search-input').click().type(value)
  },
  whenEnterTextInSearchBar:(property, value, ignoreIfDoesNotExist) => {
    cy.get('.react-tags__search-input').click()
    searchBar.whenSuggestionsAreAvailable(property, ignoreIfDoesNotExist)

    cy.get('.react-tags__search-input').type(' ')

    if (value && value !== null) {
      searchBar.whenSuggestionsAreAvailable(value, ignoreIfDoesNotExist)
      cy.get('.react-tags__search-input').type(' ')
    }
  },
  whenFilterByCluster:(cluster, ignoreIfDoesNotExist) => {
    searchBar.whenEnterTextInSearchBar('cluster', cluster, ignoreIfDoesNotExist)
  },
  whenFilterByClusterAndNamespace:(cluster, namespace, ignoreIfDoesNotExist) => {
    searchBar.whenFilterByCluster(cluster, ignoreIfDoesNotExist)
    searchBar.whenEnterTextInSearchBar('namespace', namespace, ignoreIfDoesNotExist)
  },
  whenFilterByKind:(kind, ignoreIfDoesNotExist) => {
    searchBar.whenEnterTextInSearchBar('kind', kind, ignoreIfDoesNotExist)
  },
  whenFilterByName:(name, ignoreIfDoesNotExist) => {
    searchBar.whenEnterTextInSearchBar('name', name, ignoreIfDoesNotExist)
  },
  whenFilterByNamespace:(namespace, ignoreIfDoesNotExist) => {
    searchBar.whenEnterTextInSearchBar('namespace', namespace, ignoreIfDoesNotExist)
  },
  whenSelectFirstSuggestedValue:() => {
    searchBar.shouldSuggestValues()

    cy.get('.react-tags__suggestions li[role="option"]').eq(1).click()
  },
  shouldSuggestValues:() => {
    cy.waitUntilNotContains('.react-tags__suggestions', SEARCH_MESSAGES_LOADING_SUGGESTIONS, { timeout: 60000, interval: 100 })
  }
}
