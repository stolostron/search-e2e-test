/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

export const popupModal = {
  shouldDeleteResource: () => {
    cy.get('button.pf-m-danger').should('exist').click()
    cy.get('.pf-v5-c-alert pf-m-inline pf-m-danger').should('not.exist')
  },
  shouldLoad: () => {
    cy.get('.pf-v5-c-modal-box').should('exist')
    cy.get('.pf-v5-c-alert__title').should('not.exist')
  },
  shouldNotExist: () => {
    cy.get('.pf-v5-c-modal-box').should('not.exist')
    cy.get('button.pf-m-danger').should('not.exist')
  },
  whenAccept: () => {
    popupModal.shouldLoad()
    popupModal.shouldDeleteResource()
    popupModal.shouldNotExist()
  },
}
