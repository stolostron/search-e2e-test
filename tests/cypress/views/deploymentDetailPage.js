/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

import { pf } from '../support/selectors'

/**
 * Deployment resource details page that is accessible through the ACM Search page.
 */
export const deploymentDetailPage = {
  /**
   * Navigate to the kind deployment resource yaml details from Search and edit the replica count so pod resources can scale.
   * @param {string} expected The expected string within the logs returned inside of the pod container.
   */
  whenScaleReplicasTo: (replicas) => {
    cy.get(pf.page.mainSection).should('exist')
    cy.get('p').filter(':contains(Read only)').should('exist')
    cy.get(`${pf.button.primary}[aria-disabled="false"]`).should('exist').click()
    cy.get('p').filter(':contains(Editing mode)').should('exist')
    cy.get('.react-monaco-editor-container')
      .should('exist')
      .click()
      .type(Cypress.platform !== 'darwin' ? '{ctrl}f' : '{meta}f')
      .get('.find-widget .monaco-inputbox textarea:first')
      .click()
      .type('replicas: 1')
    cy.get('.react-monaco-editor-container .view-line > span')
      .should('exist')
      .filter(':contains(replicas:)')
      .contains(1)
      .should('exist')
      .click()
      .focused()
      .type('{del}' + replicas)
    cy.get(`button${pf.mod.primary}`).filter(':contains("Save")').should('exist').click()
    cy.get('p').filter(':contains(Read only)').should('exist')
    cy.reload()
  },
}
