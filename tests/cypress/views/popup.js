/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

import { pf } from '../support/selectors'

export const popupModal = {
  shouldDeleteResource: () => {
    cy.get(pf.button.danger).should('exist').click()
    cy.get(pf.alert.inlineDanger).should('not.exist')
  },
  shouldLoad: () => {
    cy.get(pf.modal.box).should('exist')
    cy.get(pf.alert.title).should('not.exist')
  },
  shouldNotExist: () => {
    cy.get(pf.modal.box).should('not.exist')
    cy.get(pf.button.danger).should('not.exist')
  },
  whenAccept: () => {
    popupModal.shouldLoad()
    popupModal.shouldDeleteResource()
    popupModal.shouldNotExist()
  },
}
