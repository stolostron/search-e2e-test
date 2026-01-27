/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

import { pf } from '../support/selectors'

/**
 * Pod resource details page that is accessible through the ACM Search page.
 */
export const podDetailPage = {
  /**
   * Verify that the Search page should contain the expected logs within the kind pod resource's detail logs page.
   * @param {string} expected The expected string within the logs returned inside of the pod container.
   */
  shouldSeeLogs: (expected) => {
    cy.get(`${pf.form.groupControl} ${pf.select.base}`).should('exist').click()
    cy.get(pf.select.menu).should('exist').click()

    if (expected) {
      cy.get(pf.logViewer.text).should('exist').and('contain', expected)
    } else {
      cy.get(pf.logViewer.text).should('exist')
    }
  },
  /**
   * Navigate the test user to the kind pod resource's detail logs page.
   */
  whenClickOnLogsTab: () => {
    cy.get(pf.page.mainSection).should('exist')
    // In PF6, these are tabs not nav links
    cy.contains('Logs').should('exist').click()
  },
}
