/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { popupModal } from '../views/popup'

export const pageLoader = {
  shouldExist: () => cy.get('.content-spinner', { timeout: 20000 }).should('exist')  ,
  shouldNotExist: () => cy.get('.content-spinner', { timeout: 20000 }).should('not.exist')
}

export const searchPage = {
  whenGoToSearchPage:() => cy.visit('/multicloud/search'),
  whenExpandQuickFilters:() => {
    cy.get('.show-more-results-button > button').focus().click()
  },
  whenGetResourceDetailItem:(resource, name) => {
    return cy.contains('.search--resource-table-header-button', resource, {timeout: 6000})
             .parentsUntil('.search--resource-table')
             .find('table.bx--data-table-v2 tbody tr').contains('td', name)
             .parent();
  },
  whenDeleteResourceDetailItem:(resource, name) => {
    searchPage.whenGetResourceDetailItem(resource, name).find('td div.bx--overflow-menu').click()
    cy.get('.bx--overflow-menu-options button[data-table-action="table.actions.remove"]').click()
    popupModal.whenAccept()
  },
  whenGoToResourceDetailItemPage: (resource, name) => {
    searchPage.whenGetResourceDetailItem(resource, name).find('td').eq(0).find('a').click()
  },
  shouldLoadResults:() => cy.get('.search--results-view', {timeout: 20000}).should('not.exist'),
  shouldExist:() => {
    cy.get('.bx--detail-page-header-title', {timeout: 20000}).should('exist'),
    cy.get('.react-tags__search-input input', {timeout: 20000}).should('exist')
    cy.get('.saved-search-query-header', { timeout: 20000}).should('exist')
  },
  shouldFindNoResults: () => {
    cy.get('.page-content-container', { timeout: 60000}).contains('No search results found.')
  },
  shouldFindQuickFilter: (resource, count, options) => {
    searchPage.whenExpandQuickFilters()
    cy.get('[for="related-resource-' + resource + '"] > .bx--tile-content', options).invoke('text').should('contain', count)
  },
  shouldFindResourceDetailItem: (resource, name) => {
    searchPage.whenGetResourceDetailItem(resource, name).should('exist')
  },
  shouldBeResourceDetailItemCreatedFewSecondsAgo: (resource, name) => {
    searchPage.whenGetResourceDetailItem(resource, name).parent().contains('td', 'a few seconds ago')
  }
}

export const searchBar = {
  whenFocusSearchBar:() => {
    cy.get('.react-tags', {timeout:20000}).click()
    cy.get('.react-tags__suggestions').should('exist')
  },
  whenEnterTextInSearchBar:(property, value) => {
    cy.get('.react-tags__search-input input').type(property),
    cy.get('.react-tags').should('exist'),
    cy.get('.react-tags__search-input input').should('exist').click(),
    cy.get('.react-tags__suggestions').should('exist'),
    cy.get('.react-tags__search-input').should('exist')
    cy.get('.react-tags__search-input input').type(' ')
    if (value !== null) {
      cy.get('.react-tags__search-input input').type(value)
      cy.get('.react-tags__search-input input').type(' ')
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
  }
}
