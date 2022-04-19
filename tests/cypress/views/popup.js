/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

/**
 * Pop up modal object for the ACM console.
 */
export const popupModal = {
  /**
   * Verify that the modal has a button that when clicked will delete the resource object from the current console page.
   */
  shouldDeleteResource: () => {
    cy.get('button.pf-m-danger[aria-disabled="false"]').should('exist').click()
    cy.get('.pf-c-alert pf-m-inline pf-m-danger').should('not.exist')
  },
  /**
   * Verify that the modal has been opened and should be fully visible on the current console page.
   */
  shouldLoad: () => {
    cy.get('.pf-c-modal-box').should('exist')
    cy.get('.pf-c-alert__title').should('not.exist')
  },
  /**
   * Verify that the modal has been closed and no longer visible on the current console page.
   */
  shouldNotExist: () => {
    cy.get('.pf-c-modal-box').should('not.exist')
    cy.get('button.pf-m-danger').should('not.exist')
  },
  /**
   * Press the actionable button of the modal window that will execute the targeted request.
   */
  whenAccept: () => {
    popupModal.shouldLoad()
    popupModal.shouldDeleteResource()
    popupModal.shouldNotExist()
  },
}
