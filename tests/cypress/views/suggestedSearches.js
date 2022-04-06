/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { searchPage } from './search'

/**
 * Suggested searches object for the Search page within the ACM console.
 */
export const suggestedSearches = {
  /**
   * Select the related resource item tile within the Search page.
   * @param {string} title The title of the suggested filter panel.
   */
  whenSelectCardWithTitle: (title) => {
    cy.get('.pf-c-card__title').filter(`:contains(${title})`).click()
  },
  /**
   * Verify the related resource item details within the Search page.
   */
  whenVerifyRelatedItemsDetails: () => {
    searchPage.shouldLoad()
    cy.get('.pf-l-gallery.pf-m-gutter')
      .should('exist')
      .then(($related) => {
        if ($related.children().length > 0) {
          cy.get('.pf-c-tile__body').first().click()
          cy.get('.pf-c-expandable-section__toggle-text').should(
            'contain.text',
            'Related'
          )
        }
      })
  },
}
