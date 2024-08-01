/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/**
 * Pod resource details page that is accessible through the ACM Search page.
 */
export const podDetailPage = {
  /**
   * Verify that the Search page should contain the expected logs within the kind pod resource's detail logs page.
   * @param {string} expected The expected string within the logs returned inside of the pod container.
   */
  shouldSeeLogs: (expected) => {
    cy.get('.pf-c-form__group-control .pf-c-select').should('exist').click()
    cy.get('ul.pf-c-select__menu').should('exist').click()

    if (expected) {
      cy.get('.pf-c-log-viewer__text').should('exist').and('contain', expected)
    } else {
      cy.get('.pf-c-log-viewer__text').should('exist')
    }
  },
  /**
   * Navigate the test user to the kind pod resource's detail logs page.
   */
  whenClickOnLogsTab: () => {
    cy.get('.pf-c-page__main-section').should('exist')
    cy.get('.pf-c-nav__link').filter(':contains(Logs)').should('exist').click()
  },
}
