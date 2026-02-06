/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

import { capitalize } from '../scripts/cliHelper'
import { pf } from '../support/selectors'
import { popupModal } from './popup'

const SEARCH_MESSAGES_NO_RESULTS = 'No results found for the current search criteria.'
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
  shouldFindKindResourceInNamespace: (kind, name, namespace) => {
    searchBar.whenEnterTextInSearchBar('kind', kind)
    searchBar.whenEnterTextInSearchBar('name', name)
    searchBar.whenEnterTextInSearchBar('namespace', namespace)
  },
  /**
   * Verify that the resource is available within the Search page from the specified cluster.
   * @param {string} namespace The namespace of the resource object.
   * @param {string} cluster The cluster that contains the namespace resource object.
   */
  shouldFindNamespaceInCluster: (namespace, cluster) => {
    searchBar.whenEnterTextInSearchBar('namespace', namespace)
    searchBar.whenEnterTextInSearchBar('cluster', cluster)
  },
  /**
   * Verify that the Search page should not find any results for the query entered within the search input.
   */
  shouldFindNoResults: () => {
    cy.reloadUntil(
      () => {
        searchPage.shouldFindNoSkeleton()
        return cy.ifContains(pf.alert.title, SEARCH_MESSAGES_NO_RESULTS)
      },
      { interval: 5 }
    )
  },
  /**
   * Verify that the search page should contain no skeleton placeholder elements.
   */
  shouldFindNoSkeleton: () => {
    cy.get(pf.emptyState.icon).should('not.exist')
    cy.get(pf.skeleton.base).should('not.exist')
  },
  /**
   * Verify that the Search page should contain the related kind resource tile with the correct resource count.
   * @param {string} kind
   * @param {int} count
   */
  shouldFindRelationshipTile: (kind) => {
    cy.get(pf.skeleton.base).should('not.exist')
    cy.contains(pf.accordion.toggleText, kind).should('exist')
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
        cy.get(pf.accordion.toggleText)
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
    searchPage.shouldFindNoSkeleton()
    cy.get(pf.title.h1).filter(':contains(Search)').should('exist')
    cy.get(pf.textInputGroup.textInput).should('exist')
  },
  /**
   * Verify that the Search page should have loaded the resource table.
   */
  shouldLoadResults: () => {
    cy.get(pf.accordion.toggle).should('exist').and('be.visible')

    cy.get('body').then((body) => {
      if (body.find(pf.table.base).length === 0) {
        searchPage.whenOpenFirstResourceTableTile()
      }
    })
  },
  /**
   * Verify that the saved search tab is rendered on the Search page.
   */
  shouldRenderSavedSearchesTab: () => {
    cy.get(pf.menuToggle.text).filter(':contains(Saved searches)').should('exist')
  },
  /**
   * Verify that the search bar is rendered on the Search page.
   */
  shouldRenderSearchBar: () => {
    cy.get(pf.textInputGroup.textInput).should('exist')
  },
  /**
   * Verify that the suggested searches header and tiles are rendered on the Search page.
   */
  shouldRenderSuggestedSearches: () => {
    cy.get(pf.title.h4).filter(':contains(Suggested search templates)').should('exist')
    cy.get(pf.card.base).should('exist')
  },
  /**
   * Expands the related resources tiles located within the Search page.
   */
  whenExpandRelationshipTiles: () => {
    cy.get(pf.expandableSection.toggle).contains('Show related resources').should('exist').click()
  },
  whenOpenFirstResourceTableTile: () => {
    cy.get(pf.accordion.toggle).should('exist').and('be.visible').first().click()
  },
  whenOpenResourceTableTile: (kind) => {
    cy.get(pf.expandableSection.base)
      .should('have.lengthOf.at.most', 2)
      .then(() => {
        cy.get(pf.expandableSection.toggle).contains(capitalize(kind)).click()
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
    cy.get(pf.table.base).should('exist').and('be.visible')
    var row = cy.get('tr').filter(`:contains(${name})`)

    if (kind === 'Pod') return row.filter(`:contains(${namespace})`).filter(':contains(Running)').first()
    else if (namespace) return row.filter(`:contains(${namespace})`).first()
    else return row
  },
  /**
   * Get the resource table row of the specified kind resource object and deletes the resource within the Search page.
   * @param {string} kind The kind of the test resource object that will be deleted.
   * @param {string} name The name of the test resource object that will be deleted.
   * @param {string} namespace The namespace from which the resource object will be deleted.
   */
  whenDeleteResourceDetailItem: (kind, name, namespace) => {
    searchPage.whenGetResourceTableRow(kind, name, namespace).find(pf.dropdown.toggle).click()
    cy.get(pf.dropdown.menuItem).should('contain', `Delete ${kind}`).click()
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
    searchPage.whenGetResourceTableRow(kind, name, namespace).find('td[data-label="Name"] a').click({ force: true })
  },
}

/**
 * Search bar object for the Search page within the ACM console.
 */
export const searchBar = {
  shouldContainTag: (filter) => {
    cy.get(pf.labelGroup.list).should('contain', filter)
  },
  whenSuggestionsAreAvailable: (value, ignoreIfDoesNotExist) => {
    if (!ignoreIfDoesNotExist) {
      cy.get(pf.menu.list).children().should('have.length.above', 1)
    }
    cy.get(pf.textInputGroup.textInput).click().type(value)
  },
  whenEnterTextInSearchBar: (property, value, ignoreIfDoesNotExist) => {
    cy.get(pf.textInputGroup.textInput).click()
    searchBar.whenSuggestionsAreAvailable(property, ignoreIfDoesNotExist)

    cy.get(pf.textInputGroup.textInput).type(' ')

    if (value && value !== null) {
      searchBar.whenSuggestionsAreAvailable(value, ignoreIfDoesNotExist)
      cy.get(pf.textInputGroup.textInput).type(' ')
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
    searchBar.whenEnterTextInSearchBar('namespace', namespace, ignoreIfDoesNotExist)
  },
  /**
   * Execute the search query by pressing the run search (right arrow) button on the Search page.
   */
  whenRunSearchQuery: () => {
    cy.get('#run-search-button').should('exist').and('be.visible').click()
    searchPage.shouldFindNoSkeleton()
  },
  /**
   * Change pagination size for the Search results table.
   * @param {int} size The amount of resources to be displayed within the table.
   */
  whenUsePagination: (size = 10) => {
    // Click the pagination menu toggle
    cy.get(pf.pagination.base)
      .should('exist')
      .and('be.visible')
      .first()
      .find(pf.menuToggle.button)
      .should('exist')
      .click()
    // Menu content is rendered as a portal outside pagination, so find it at document level
    cy.get(pf.menu.content).should('exist')
    cy.get(`li[data-action="per-page-${size}"]`).should('exist').click()
  },
}
