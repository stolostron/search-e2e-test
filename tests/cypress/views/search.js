/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { capitalize } from '../scripts/cliHelper'
import { podDetailPage } from './podDetailPage'
import { popupModal } from './popup'

const SEARCH_MESSAGES_NO_RESULTS =
  'No results found for the current search criteria.'
const SEARCH_MESSAGES_FEW_SECONDS_AGO = 'a few seconds ago'

/**
 * Search page object for the ACM console.
 */
export const searchPage = {
  /**
   * Verify that the resource is deleted within the Search page from the specified namespace.
   * @param {string} kind The kind of the resource object.
   * @param {string} name The name of the resource object.
   * @param {string} namespace The namespace that contains the resource object.
   */
  shouldDeleteKindResourceInNameSpace: (kind, name, namespace) => {
    searchPage.whenDeleteResourceDetailItem(kind, name, namespace)
    searchPage.shouldFindNoResults()
  },
  /**
   * Verify that the resource is available within the Search page from the specified namespace.
   * @param {string} kind The kind of the resource object.
   * @param {string} name The name of the resource object.
   * @param {string} namespace The namespace that contains the resource object.
   */
  shouldFindKindInCluster: (kind, cluster) => {
    searchBar.whenEnterTextInSearchBar('kind', kind)
    searchBar.whenEnterTextInSearchBar('cluster', cluster)
  },
  /**
   * Verify that the resource is available within the Search page from the specified namespace.
   * @param {string} kind The kind of the resource object.
   * @param {string} name The name of the resource object.
   * @param {string} namespace The namespace that contains the resource object.
   */
  shouldFindKindResourceInNamespace: (
    kind,
    name,
    namespace
  ) => {
    searchBar.whenEnterTextInSearchBar('kind', kind)
    searchBar.whenEnterTextInSearchBar('name', name)
    searchBar.whenEnterTextInSearchBar(
      'namespace',
      namespace
    )
  },
  /**
   * Verify that the resource is available within the Search page from the specified cluster.
   * @param {string} namespace The namespace of the resource object.
   * @param {string} cluster The cluster that contains the namespace resource object.
   */
  shouldFindNamespaceInCluster: (namespace, cluster) => {
    searchBar.whenEnterTextInSearchBar(
      'namespace',
      namespace
    )
    searchBar.whenEnterTextInSearchBar('cluster', cluster)
  },
  /**
   * Verify that the Search page should not find any results for the query entered within the search input.
   */
  shouldFindNoResults: () => {
    cy.reloadUntil(
      () => {
        cy.get('.pf-c-alert.pf-m-inline.pf-m-info')
          .filter(`:contains(${SEARCH_MESSAGES_NO_RESULTS})`)
          .should('exist')
        return cy.ifContains('.pf-c-alert__title', SEARCH_MESSAGES_NO_RESULTS)
      },
      { interval: 5 }
    )
  },
  /**
   * Verify that the Search page should contain the related kind resource tile with the correct resource count.
   * @param {string} kind
   * @param {int} count
   */
  shouldFindRelationshipTile: (kind, count) => {
    cy.get('.pf-l-gallery.pf-m-gutter')
      .should('exist')
      .within(() => {
        cy.get('.pf-c-tile')
          .filter(`:contains(Related ${kind})`)
          .should('exist').and('contain', count)
      })
  },
  /**
   * Verify that the Search page should contain the resource table containing the details of the specified resource object.
   * @param {*} kind The kind of the resource object.
   * @param {*} name The name of the resource object.
   * @param {*} namespace TThe namespace that contains the kind resource object.
   */
  shouldFindResourceDetailItem: (kind, name, namespace) => {
    searchPage.whenGetResourceTableRow(kind, name, namespace)
  },
  /**
   * Verify that the Search page should contain a kind resource object that was created a few seconds ago withting the specified resource table.
   * @param {*} kind The kind of the resource object.
   * @param {*} name The name of the resource object.
   * @param {*} namespace TThe namespace that contains the kind resource object.
   */
  shouldFindResourceDetailItemCreatedFewSecondsAgo: (kind, name, namespace) => {
    cy.reloadUntil(
      () => {
        cy.get('.pf-c-expandable-section')
          .filter(`:contains(${capitalize(kind)})`)
          .should('exist')
          .then(() => {
            searchPage.shouldLoadResults()
          })
        cy.get('tr').filter(`:contains(${name})`).should('contain', namespace)
        return cy.ifContains('td', SEARCH_MESSAGES_FEW_SECONDS_AGO)
      },
      { interval: 5 }
    )
  },
  /**
   * Verify that the resource is available within the Search page from the specified cluster.
   * @param {string} kind The namespace of the resource object.
   * @param {string} name The cluster that contains the namespace resource object.
   */
  shouldFindResourceInKind: (kind, name) => {
    searchBar.whenEnterTextInSearchBar('kind', kind)
    searchBar.whenEnterTextInSearchBar('name', name)
  },
  /**
   * Verify that the Search page is loaded correctly.
   */
  shouldLoad: () => {
    cy.get('.pf-c-empty-state__icon').should('not.exist')
    cy.get('.pf-c-skeleton').should('not.exist')
    cy.get('.pf-c-title').filter(':contains(Search)').should('exist')
    cy.get('.react-tags').should('exist')
    cy.get('.react-tags__search-input').should('exist')
  },
  /**
   * Verify that the Search page should have loaded the resource table.
   */
  shouldLoadResults: () => {
    cy.get('table.pf-c-table').should('exist')
  },
  shouldSelectFirstSuggestionValue: () => {
    cy.get('.react-tags__suggestions ul#ReactTags')
      .should('exist')
      .children()
      .should('have.length.above', 1)
    cy.get('li#ReactTags-1').click()
  },
  shouldValidateManagedCluster: () => {
    searchBar.whenEnterTextInSearchBar('ManagedClusterJoined', 'True')
    searchPage.shouldLoadResults()
  },
  shouldValidateSearchQuery: () => {
    searchPage.shouldLoadResults()
    cy.get('.pf-c-alert pf-m-inline pf-m-danger').should('not.exist')
  },
  shouldVerifyManagedClusterPodsAreRunning: (cluster, checkLogs) => {
    searchPage.shouldFindKindInCluster('pod', cluster)
    searchBar.whenEnterTextInSearchBar('namespace')
    searchPage.shouldSelectFirstSuggestionValue()
    searchPage.shouldLoadResults()
    cy.get(`[data-label="Status"]`).should('contain', 'Running')

    if (checkLogs) {
      cy.get(`td[data-label="Name"]`).each(($el) => {
        searchPage.whenGoToResourceDetailItemPage('pod', $el.text())
        podDetailPage.whenClickOnLogsTab()
        cy.go('back')
      })
    }
  },
  /**
   * Expands the related resources tiles located within the Search page.
   */
  whenExpandRelationshipTiles: () => {
    cy.get('.pf-c-skeleton').should('not.exist')
    cy.get('.pf-l-gallery')
      .children()
      .should('have.length.above', 1)
      .then(() => {
        cy.get('button.pf-c-button.pf-m-secondary').focus().click()
      })
  },
  /**
   * Returns the resource table row for a resource that contains the targeted name within a given namespace.
   * @param {string} kind The kind of the test resource object
   * @param {string} name The name of the test resource object
   * @param {string} namespace The namespace of the test resource object.
   * @returns {Cypress.Chainable} Table row of the targeted test resource.
   */
  whenGetResourceTableRow: (kind, name, namespace) => {
    cy.get('.pf-c-expandable-section')
      .filter(`:contains(${capitalize(kind)})`)
      .should('exist')
    cy.get('table.pf-c-table').should('exist')

    if (namespace) {
      return cy.get('tr').filter(`:contains(${name})`).and('contain', namespace)
    } else {
      return cy.get('tr').filter(`:contains(${name})`)
    }
  },
  /**
   * Get the resource table row of the specified kind resource object and deletes the resource within the Search page.
   * @param {string} kind The kind of the test resource object that will be deleted.
   * @param {string} name The name of the test resource object that will be deleted.
   * @param {string} namespace The namespace from which the resource object will be deleted.
   */
  whenDeleteResourceDetailItem: (kind, name, namespace) => {
    searchPage
      .whenGetResourceTableRow(kind, name, namespace)
      .find('.pf-c-dropdown__toggle')
      .click()
    cy.get('button.pf-c-dropdown__menu-item')
      .should('contain', `Delete ${kind}`)
      .click()
    popupModal.whenAccept()
  },
  /**
   *
   * @param {string} cluster The test cluster environment from which the resource object will be deleted.
   * @param {string} name The namespace that will be deleted from the test cluster environment.
   */
  whenDeleteNamespace: (cluster, name) => {
    searchBar.whenFilterByKind('namespace')
    searchBar.whenFilterByName(name)
    searchBar.whenFilterByCluster(cluster)
    searchPage.shouldLoadResults()
    searchPage.whenDeleteResourceDetailItem('namespace', name)
  },
  whenGoToResourceDetailItemPage: (kind, name, namespace) => {
    searchPage
      .whenGetResourceTableRow(kind, name, namespace)
      .find('td')
      .first()
      .click()
  },
  /**
   * Navigate the test user to the Search page within the ACM console.
   */
  whenGoToSearchPage: () => {
    cy.visit('/multicloud/home/search')
    searchPage.shouldLoad()
  },
}

/**
 * Search bar object for the Search page within the ACM console.
 */
export const searchBar = {
  shouldContainTag: (filter) => {
    cy.get('.react-tags__selected-tag-name').should('contain', filter)
  },
  shouldSuggestValues: (value) => {
    cy.get('.react-tags__search-input').click().type(value).type(' ')
    cy.get('.react-tags__suggestions ul#ReactTags')
      .should('exist')
      .children()
      .should('have.length.above', 1)
  },
  whenFocusSearchBar: () => {
    cy.get('.react-tags').click()
  },
  whenSuggestionsAreAvailable: (value, ignoreIfDoesNotExist) => {
    if (!ignoreIfDoesNotExist) {
      cy.get('.react-tags__suggestions ul#ReactTags')
        .children()
        .should('have.length.above', 1)
    }
    cy.get('.react-tags__search-input').click().type(value)
  },
  whenEnterTextInSearchBar: (property, value, ignoreIfDoesNotExist) => {
    cy.get('.react-tags__search-input').click()
    searchBar.whenSuggestionsAreAvailable(property, ignoreIfDoesNotExist)

    cy.get('.react-tags__search-input').type(' ')

    if (value && value !== null) {
      searchBar.whenSuggestionsAreAvailable(value, ignoreIfDoesNotExist)
      cy.get('.react-tags__search-input').type(' ')
    }
  },
  /**
   * Filter for the specified cluster within the search bar on the Search page.
   * @param {string} cluster The cluster of the resource object to query for within the search input bar.
   * @param {bool} ignoreIfDoesNotExist Option to ignore the Search page prompts (No results found...) if resource is not found.
   */
  whenFilterByCluster: (cluster, ignoreIfDoesNotExist) => {
    searchBar.whenEnterTextInSearchBar('cluster', cluster, ignoreIfDoesNotExist)
  },
  /**
   * Filter for the specified kind within the search bar on the Search page.
   * @param {string} kind The kind of the resource object to query for within the search input bar.
   * @param {bool} ignoreIfDoesNotExist Option to ignore the Search page prompts (No results found...) if resource is not found.
   */
  whenFilterByKind: (kind, ignoreIfDoesNotExist) => {
    searchBar.whenEnterTextInSearchBar('kind', kind, ignoreIfDoesNotExist)
  },
  /**
   * Filter for the specified name within the search bar on the Search page.
   * @param {string} name The name of the resource object to query for within the search input bar.
   * @param {bool} ignoreIfDoesNotExist Option to ignore the Search page prompts (No results found...) if resource is not found.
   */
  whenFilterByName: (name, ignoreIfDoesNotExist) => {
    searchBar.whenEnterTextInSearchBar('name', name, ignoreIfDoesNotExist)
  },
  /**
   * Filter for the specified namespace within the search bar on the Search page.
   * @param {string} namespace The namespace of the resource object to query for within the search input bar.
   * @param {bool} ignoreIfDoesNotExist Option to ignore the Search page prompts (No results found...) if resource is not found.
   */
  whenFilterByNamespace: (namespace, ignoreIfDoesNotExist) => {
    searchBar.whenEnterTextInSearchBar(
      'namespace',
      namespace,
      ignoreIfDoesNotExist
    )
  },
  whenSelectFirstSuggestedValue: (value) => {
    searchBar.shouldSuggestValues(value)
    cy.get('.react-tags__suggestions ul#ReactTags').within(() => {
      cy.get('li').not('.is-disabled').first().click()
    })
    searchPage.shouldLoadResults()
  },
}
