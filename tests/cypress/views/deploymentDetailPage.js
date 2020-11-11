/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { popupModal } from '../views/popup'

export const deploymentDetailPage = {
  whenScaleReplicasTo:(replicas) => {
    cy.get('.details-yaml-editOptions > .bx--btn').click()
    cy.get('.react-monaco-editor-container').click().type(Cypress.platform !== 'darwin' ? '{ctrl}f' : '{meta}f')
      .get('.find-widget .monaco-inputbox textarea:first').focus().click().type('replicas: ')
    cy.get('.react-monaco-editor-container .view-line > span')
      .contains('replicas: ').parent()
      .find('span:last').click().focused().type('{del}' + replicas)
    cy.get('.details-yaml-editOptions > :nth-child(2)').click()
    popupModal.whenAccept()
  }
}
