/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2021 Red Hat, Inc.
 ****************************************************************************** */

import { pf } from '../support/selectors'

/**
 * Suggested searches object for the Search page within the ACM console.
 */
export const suggestedSearches = {
  /**
   * Select the related resource item tile within the Search page.
   * @param {string} title The title of the suggested filter panel.
   */
  whenSelectCardWithTitle: (title) => {
    cy.get(pf.card.title).filter(`:contains(${title})`).should('exist').and('be.visible').click()
  },
}
