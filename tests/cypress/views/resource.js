/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/// <reference types="cypress" />

import { searchBar } from "./search";
const typeDelay = 1

export const resourcePage = {
  whenGoToResourcePage: () => cy.get('#acm-create-resource', { timeout: 20000 }).click(),
  whenSelectTargetCluster: (clusterName) => {
    cy.get('#create-resource-select', { timeout: 20000 }).click()
    cy.get('.bx--checkbox-wrapper input[name="' + clusterName + '"]').parent().click()
  },
  whenCreateNamespace: (namespace) => {
    // WORKAROUND: delays are needed because this cypress issue https://github.com/cypress-io/cypress/issues/5480
    cy.get('.react-monaco-editor-container').click().focused().type(Cypress.platform !== 'darwin' ? '{ctrl}a' : '{meta}a')
      .type('{enter}apiVersion: v1{enter}', { delay: typeDelay })
      .type('kind: Namespace{enter}', { delay: typeDelay })
      .type('metadata:{enter}', { delay: typeDelay })
      .type('  name: ' + namespace + '{enter}', { delay: typeDelay });
    resourcePage.shouldCreateResource('namespace', namespace);
  },
  whenCreateDeployment: (namespace, name, image) => {
    // WORKAROUND: delays are needed because this cypress issue https://github.com/cypress-io/cypress/issues/5480
    cy.get('.react-monaco-editor-container').click().focused().type(Cypress.platform !== 'darwin' ? '{ctrl}a' : '{meta}a')
      .type('{enter}apiVersion: apps/v1{enter}', { delay: typeDelay })
      .type('kind: Deployment{enter}', { delay: typeDelay })
      .type('metadata:{enter}', { delay: typeDelay })
      .type('  name: ' + name + '{enter}{backspace}', { delay: typeDelay })
      .type('  namespace: ' + namespace + '{enter}{backspace}', { delay: typeDelay })
      .type('spec:{enter}', { delay: typeDelay })
      .type('  replicas: 1{enter}{backspace}', { delay: typeDelay })
      .type('  selector:{enter}{backspace}', { delay: typeDelay })
      .type('    matchLabels:{enter}{backspace}{backspace}', { delay: typeDelay })
      .type('      app: ' + name + '{enter}{backspace}{backspace}{backspace}', { delay: typeDelay })
      .type('  template:{enter}{backspace}', { delay: typeDelay })
      .type('    metadata:{enter}{backspace}{backspace}', { delay: typeDelay })
      .type('      labels:{enter}{backspace}{backspace}{backspace}', { delay: typeDelay })
      .type('        app: ' + name + '{enter}{backspace}{backspace}{backspace}{backspace}', { delay: typeDelay })
      .type('    spec:{enter}{backspace}{backspace}', { delay: typeDelay })
      .type('      containers:{enter}{backspace}{backspace}{backspace}', { delay: typeDelay })
      .type('        - name: ' + name + '{enter}{backspace}{backspace}{backspace}{backspace}', { delay: typeDelay })
      .type('          image: ' + image + '{enter}', { delay: typeDelay });
    resourcePage.shouldCreateResource('deployment', name);
  },
  shouldCreateResource: (resource, name) => {
    const attempt = cy.state('runnable')._currentRetry
    cy.get('.bx--btn--primary', {timeout: 30000}).click();

    if (attempt > 0) {
      cy.get('.bx--inline-notification__subtitle', {timeout: 30000}).should('exist').contains('already exist')
      cy.get('.bx--btn.bx--btn--secondary', {timeout: 30000}).click().wait(300)
      cy.get('svg.clear-button', {timeout: 30000}).should('exist').click()
      resourcePage.shouldCheckIfResourceCreated(resource, name)
    } else {
      cy.get('.bx--inline-notification__subtitle').should('not.exist')
      cy.get('.bx--inline-notification', { timeout: 30000 }).should('not.exist');
      cy.get('.react-monaco-editor-container', { timeout: 30000 }).should('not.exist');
    }
  },
  shouldCheckIfResourceCreated: (property, value) => {
    searchBar.whenFocusSearchBar()
    searchBar.whenFilterByKind(property)
    searchBar.whenFilterByName(value)
    cy.get('.pf-l-gallery', {timeout: 20000}).children().wait(1000).should('have.length.greaterThan', 0)
  },
}
